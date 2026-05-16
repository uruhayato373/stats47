---
type: improvement-log
metric: psi
created: 2026-05-16
updated: 2026-05-16
---

# PSI 改善ログ

施策ベースで append-only。新しい施策は最新を上に追加。判定が変わったら section 末尾に追記。

## T2-CWV-04: /areas と /search の CLS 実装 (Phase 1A + 1B)

- **status**: pending
- **tier**: 2
- **target_metric**: psi-cls
- **deployed_at**: 2026-04-25
- **related_issue**: #114 (closed)

### 施策 ID
- **Tier**: T2 (UX / Core Web Vitals)
- **Category**: CWV
- **連番**: 04（#27 [T2-CWV-01] CWV CLS 統合対策の Phase 1A / 1B を分離、2026-04-25）

### 背景

#27 で Phase 0（AdSense CLS）と Phase 2（ブログ SVG CLS）はデプロイ済み・観測フェーズに入ったため close した。残る Phase 1A / 1B は未実装の作業項目で、PSI で **error 判定（CLS が閾値の 2-3 倍）** のため独立 issue 化して進捗を追う。

### ターゲット指標
- [x] PSI CLS (mobile)
- [x] Avg Position (Core Web Vitals Poor 率低下による)

### 対象ページ / 改修内容

#### Phase 1A: /areas（CLS=0.324 / 閾値の 3.2 倍）

**原因（コード確認済）:**
`apps/web/src/features/area-profile/components/AreaSelectorMap.tsx` で `AreaSelectorMap` が `dynamic({ ssr: false })` 読み込み:

1. Server render: `<div>` は空（高さ 0）
2. Client hydration: TileGridMap が描画されて自然サイズ（aspect ratio 1.2）で膨らむ
3. 下のコンテンツ（地方ブロック別リンク）が瞬間的に下へジャンプ → CLS 発生

**対策:**
`AreaSelectorMap` のラッパー div に `aspect-[5/6]`（= 1.2）を予約。Server 描画時点で空 div が正しい高さを占有 → ジャンプゼロ。

#### Phase 1B: /search（CLS=0.209 / 閾値の 2.1 倍）

**原因（仮説）:**
`apps/web/src/features/search/SearchPageClient.tsx:197-198` の `isInitializing` 初期 true → `SearchPageSkeleton` 表示。

```tsx
function SearchPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-full mb-4" />
      <Skeleton className="h-20 w-full mb-4" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
```

実際のページは hero search（~120px）+ filters（~200px）+ results（min-h-[400px]）で、Skeleton と高さが合っていない。

**対策:**
Skeleton を実レイアウトに揃える。`isInitializing` の解消タイミングで layout shift が発生しないようにする。

### 想定効果

- /areas mobile CLS: **0.324 → <0.1**
- /search mobile CLS: **0.209 → <0.1**
- PSI Performance / overall CLS 改善

### 検証

- ローカル `npm run dev` で Chrome DevTools Performance → Layout Shifts を視覚確認
- デプロイ後 PSI dispatch → CLS 再計測

### 関連
- 親 issue: #27 [T2-CWV-01] CWV CLS 統合対策（Phase 0 / 2 デプロイ済、2026-04-25 close）
- 元 issue: #79 [T2-CWV-04]（2026-04-25 #27 統合 close）の作業内容を継承

---

## T1-PSI-LCP-02: ランキング詳細 LCP 改善 — Leaflet tile 読み込み遅延 4.3s 対策 (EXP-003)

- **status**: pending
- **tier**: 1
- **target_metric**: psi-lcp
- **deployed_at**: 2026-04-24
- **related_issue**: #101 (closed)

### 施策 ID
- **Tier**: T1（最優先）
- **Category**: PSI / LCP
- **連番**: 02（#74 EXP-002 ADVERSE の後継）
- **関連**: #74 EXP-002（HTML 削減アプローチで ADVERSE、revert 済）

### ターゲット指標
- [x] PSI LCP (mobile, ranking page): 12,451ms → **< 5,000ms** を目標
- [x] PSI Performance (mobile): 27 → 60+

### 現状データ（2026-04-25 計測）
- `/ranking/total-population` mobile LCP = **12,451ms**
- **LCP element = `img.leaflet-tile`**（Leaflet 地図タイル）
- **LCP breakdown（4 subparts）**:
  - timeToFirstByte: 2ms
  - **resourceLoadDelay: 4,347ms ← 支配的（全体の 62%）**
  - resourceLoadDuration: 78ms
  - elementRenderDelay: 597ms

### RCA（LCP 要素の特定 → ボトルネック分析）

tile proxy (`/tiles/*`) は既に Cloudflare edge cache 30 日設定済（`apps/web/src/app/tiles/[theme]/[z]/[x]/[ypng]/route.ts`）。tile 自体の転送は速い。

真の問題は **resourceLoadDelay = 4,347ms** ——「ブラウザが tile 画像の URL を発見するまでの遅延」。

Leaflet は以下の順で動作:
1. HTML パース完了
2. JS (Leaflet bundle) 読み込み
3. JS 実行で map コンポーネント mount
4. map コンテナの layout 確定
5. Leaflet が必要な tile URL を計算
6. tile fetch 開始 ← ここまで 4.3s

JS 依存のレンダリング経路のため、HTML サイズを削減しても短縮されない（EXP-002 が ADVERSE になった本質）。

### 実装候補（3 案）

#### 案 A. 初期 tile の `<link rel="preload">` をページ SSR で HTML に埋め込む（推奨・中コスト）

**仕組み**: ranking 詳細ページ SSR 時に、ビューポート中央に来るタイル座標（zoom=5, x=28, y=12 の 3×3 = 9 タイル）の URL を計算し、HTML `<head>` に `<link rel="preload" as="image" href="/tiles/light_all/5/28/12@2x.png" fetchpriority="high">` を出す。

- ブラウザが HTML パース時点で tile 読み込みを開始 → Leaflet が discover する頃には既にキャッシュ済
- 期待効果: resourceLoadDelay 4,347ms → 500ms 以下、LCP ~8s 短縮
- リスク: preload tile が実際の初期表示と外れると無駄な帯域（設定次第だが zoom 5 / center Japan は固定でよい）

#### 案 B. LCP 要素を「map 以外」に差し替える（大コスト、見た目変わる）

**仕組**: ランキング詳細の最上部に大きなヘッダー / hero 画像を置き、それを LCP 要素にする。map は下に配置。

- ヘッダー画像は HTML 内 `<img fetchpriority="high">` で即座に LCP
- map の遅さは LCP に影響しない
- 期待効果: LCP < 3s（ヘッダー画像のサイズ次第）
- リスク: UI 変更が大きい。ランキング詳細ページのデザインレビュー必要

#### 案 C. Service Worker で tile を aggressive precache（大コスト、効果不定）

**仕組**: 初回訪問後に SW が先回りで typical tiles を cache。再訪問時のみ LCP 改善。

- 初訪問者には効果なし（mobile の流入パターンと相性悪い）
- 却下推奨

### 推奨
**A から着手**。preload は HTML 追加のみで SSR 側の変更、client code に触れない → ADVERSE リスクが最小。
結果が出なければ B に進む。

### 実装計画（案 A 採用の場合）
1. `apps/web/src/features/ranking/components/RankingMapChart/RankingMapChartContainer.tsx`（SSR）で初期表示 tile URL 配列を計算
2. `Head` or Next.js の `<link>` メカニズムで 9 個の preload tag を埋め込む
3. fetchpriority="high" + as="image" + crossOrigin 設定
4. CSS で tile container の寸法 (aspect-ratio) を予約して layout shift を防ぐ（既存かも）
5. ローカルで Chrome DevTools Network throttling (Fast 3G) + Performance で LCP 要素と resourceLoadDelay を確認
6. デプロイ後 PSI で実測、効果判定

### 期待効果（案 A）
- LCP mobile 12.5s → **5-6s**（▲ ~50%）
- Performance 27 → **50-55**

### ADVERSE 予防措置
- 初期 9 tile のみ preload（全 tile 予約すると帯域無駄）
- 現行 SSR に変更を加えず、`<head>` 内への追加のみ
- ローカルで throttled condition の PSI run（Lighthouse CLI）で事前検証してからデプロイ

### 参照
- #74 EXP-002（ADVERSE、教訓: LCP 要素を先に特定してから施策を設計する）
- PSI batch `.claude/state/metrics/psi/psi-batch-2026-04-24T22-39-36.json`（現在の baseline）
- `.claude/skills/management/knowledge/SKILL.md` — 「HTML 削減 ≠ LCP 改善」教訓
