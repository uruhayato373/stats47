---
type: improvement-log
metric: psi
created: 2026-05-16
updated: 2026-05-16
---

# PSI 改善ログ

施策ベースで append-only。新しい施策は最新を上に追加。判定が変わったら section 末尾に追記。

## [CWV-CANDIDATE-01] PSI 違反 URL → 修正候補 component 提案スクリプト (Phase 3 sprint)

- **status**: in-progress
- **tier**: 2
- **target_metric**: psi-lcp / psi-cls
- **owner**: claude
- **deployed_at**: 2026-05-18
- **due**: 2026-06-21 (W25)
- **related_plan**: `docs/02_実装計画/seo-todo-unify-phase-1-3.md` Phase 3

### 進捗 (2026-05-18)

Phase 3 sprint で 1 ファイル追加:
- `.claude/scripts/psi/suggest-cwv-candidates.mjs` — URL → Next.js route + features ディレクトリマッピング → tsx find + git blame + チャートライブラリ依存 hint (T1-PSI-LCP-02 / T2-CWV-04 へのポインタ)

動作確認: `/ranking/area-population` で 5 候補抽出 (Map / TileGrid / Table 等)、git blame で最終更新日 + commit hash 表示確認。

### Scope 制限 (本 sprint では実装せず)

- LLM 改修案 PR 自動起票 (Routine + Claude API 必要、別フェーズ)
- psi-audit-daily.yml への組み込み (本 sprint では candidate-suggestion CLI のみ、workflow 連携は次)

### 残作業

- ✅ psi-audit-daily.yml の違反検出 step 後に本スクリプトを呼ぶ拡張を 2026-05-18 追加 (Issue body に候補 component を自動 append)
- LLM PR 起票統合 (Phase 3 後半)

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

---

## T1-PSI-LCP-03: CookieConsentBanner SSR 化 (EXP-004)

- **status**: effect/none
- **tier**: 1
- **target_metric**: psi_lcp_ms_homepage_mobile
- **deployed_at**: 2026-05-10
- **closed_at**: 2026-05-16

### 想定効果（baseline 8,251ms → < 3,000ms = -64%）
CookieConsentBanner が `'use client'` + localStorage 依存で hydration 後に表示 → hydration 完了が LCP になっているという仮説。HTTP cookie でサーバー側 consent 検知し SSR HTML に含めることで、TTFB 時点でバナー描画 → バナーが LCP 遅延要因でなくなる。

### 実測（2026-05-15、PSI history.csv）
- ホーム mobile LCP: **8,476ms**（baseline 8,251ms 比 +2.7%）
- EXP-003 ADVERSE 状態 (16,426ms) からは **-48% 改善** = rollback としては成功
- 改善目標 (<3,000ms) には大幅未達

### 判定根拠
- 経過 5 日（5/10 deploy → 5/15 計測）
- 1 回計測（lab data variance あり、5/7 に 785ms の異常値も）
- 想定 -64% に対し実測 +2.7%（目標達成率 0%）

### 学び（実証ベース判定ルール準拠）
- **[判定]** CookieConsent SSR 化は LCP 要素ではなかった。仮説「バナー hydration 遅延が LCP」は誤り
- **[教訓]** EXP-002/003/004 と 3 連続で「LCP 要素を特定せずに hydration 仮説で改修」→ 全て effect/none or partial に終わった。auto memory `feedback_lcp_optimization.md` と完全一致
- **[次施策の起点]** LCP 要素を `lighthouseResult.audits["largest-contentful-paint-element"]` で実証ベースで特定する Phase 1 (EXP-005) を proposed 状態で立案

### 検証コマンド
```bash
grep -E ",https://stats47.jp/,mobile,homepage" .claude/state/metrics/psi/history.csv | tail -10
# quota リセット後の追加計測:
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fstats47.jp%2F&strategy=mobile&category=performance"
```

### rollback 判断
- 実施しない（baseline 水準まで戻っているため許容、EXP-003 ADVERSE よりはマシ）
- EXP-005 で LCP 要素を特定してから次の対策を組む

### 参照
- experiments.json EXP-004
- 関連 close 教訓: `docs/03_週次運用/週次レビュー/2026-W20.md` 課題2
- 次実験: EXP-005 (LCP 要素特定 Phase 1, proposed)

---

## T1-PSI-LCP-04: LCP 要素特定 Phase 1 (EXP-005) — proposed

- **status**: proposed
- **tier**: 1
- **target_metric**: lcp_element_identified
- **proposed_at**: 2026-05-16

### 背景
EXP-002 (HTML 削減・ADVERSE) / EXP-003 (Leaflet tile preload・PARTIAL) / EXP-004 (CookieConsent SSR・NONE) と 3 連続で LCP 改善が未達。共通の問題: **LCP 要素を特定せず hydration 仮説で改修** している。

### 目的
主要 5 URL (homepage / ranking / blog / search / areas) で LCP 要素を実証ベースで特定し、要素タイプ別の Phase 2 施策候補 (EXP-006/007) を立案する。改修は行わない調査 phase。

### 想定アウトプット
- 各 URL の LCP 要素 type / size / loading 属性 / preload 状況 / font dependencies を表で整理
- Phase 2 候補施策 3 件以上（要素タイプ別: image なら width/height/preload, font なら font-display:optional, SSR-deferred なら server prefetch 等）

### 実装手順
1. PSI API quota リセット後、5 URL × mobile/desktop × 3 回計測（中央値、JSON フル保存）
2. レスポンスの `lighthouseResult.audits["largest-contentful-paint-element"].details.items[0].node` から要素特定
3. 表で整理 → `docs/05_改善ログ/psi.md` に section 追加
4. EXP-006/007 を experiments.json に proposed 状態で追加

### 着手期日
W21 中（PSI quota リセット = 翌日以降）。状態 `proposed` → `running` に遷移。

### 参照
- experiments.json EXP-005
- W21 計画 `docs/03_週次運用/週次計画/2026-W21.md` Could セクション
