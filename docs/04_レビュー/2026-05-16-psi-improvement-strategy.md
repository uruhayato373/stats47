# PSI 改善策・網羅整理 (2026-05-16)

> ベースデータ: PSI 2026-05-09T17-40-53 / improvement-log 2026-04-25 時点 / memory: `feedback_lcp_optimization.md` (2026-04-25)
> 形式: 網羅型カタログ + 推奨実装フェーズ
> 関連規約: `.claude/rules/evidence-based-judgment.md` (effect 判定の必須要件)

---

## 0. Executive Summary

**現状(2026-05-09)**:
- Mobile LCP: **全 19 URL が違反** (5,104〜19,051ms / 閾値 2,500ms)
- Desktop LCP: **7/19 URL が違反** (2,274〜3,627ms / 閾値 2,000ms)
- Performance スコア: Mobile 31〜72 / Desktop 35〜90
- 閾値違反: error 72 件 / warning 53 件

**主要発見**:
1. **Cookie banner が主要 URL の LCP 要素** — `body.antialiased > div.fixed > div.container > p` が 8/19 mobile URL で LCP に。elementRenderDelay 5,564〜9,168ms = JS hydration 待ち
2. **2026-05-08 AdSense 広告枠追加で 785ms → 19,727ms に急悪化** — PR #238 (`345577c2`) / PR #239 (`0b370fa4`) で複数ページに `<AdSenseAd />` 配置。JS bundle 肥大化が hydration を遅らせた
3. **過去 EXP の教訓: LCP 要素を Lighthouse audit で特定してから施策を立てる** — EXP-002 ADVERSE, EXP-003 PARTIAL の経験あり

**Phase 1 推奨施策 (即効性)**:
- A1 or A2: **Cookie banner を SSR 静的化 or Portal 化**(LCP 候補から除外)
- B1 + B5: **AdSense JS chunk 分離 + 広告密度削減**(hydration 軽量化)
- C1: **FeaturedRankings SVG を明確に LCP 最大要素に**(置き換え戦略)

→ 目標: 主要 URL Mobile LCP 16,000ms → 4,000ms 以下(1 週間)

---

## 1. 現状(Diagnosis)

### 1.1 PSI 計測サマリー (2026-05-09)

#### Mobile (全 URL 違反 🚨)

| URL | LCP (ms) | Perf | FCP (ms) | TBT (ms) | 重要度 |
|---|---:|---:|---:|---:|---|
| /ranking | **19,051** | 52 | 3,451 | 602 | 🔴 CRITICAL |
| / (home) | **16,426** | 50 | 3,751 | 451 | 🔴 CRITICAL |
| /ranking/total-population | 14,691 | 39 | 5,101 | 864 | 🔴 CRITICAL |
| /areas/47000 | 14,035 | 45 | 3,751 | 275 | 🔴 CRITICAL |
| /areas/13000 | 14,020 | 52 | 4,051 | 502 | 🔴 CRITICAL |
| /areas | 13,805 | 31 | 3,602 | **3,204** | 🔴 CRITICAL |
| /ranking/agricultural-output | 12,001 | 33 | 5,551 | 1,349 | 🔴 CRITICAL |
| /ranking/annual-sunshine-duration | 11,921 | 35 | 5,701 | 1,134 | 🔴 CRITICAL |
| /blog | 9,151 | 50 | 4,526 | 498 | 🟠 HIGH |
| /about | 8,916 | 60 | 5,784 | 90 | 🟠 HIGH |
| /ranking/future-population-change-rate-2050 | 8,701 | 40 | 6,001 | 688 | 🟠 HIGH |
| /themes/local-economy | 7,801 | 48 | 5,101 | 430 | 🟠 HIGH |
| /search | 7,201 | 44 | 4,524 | 827 | 🟠 HIGH |
| /themes | 6,904 | 54 | 4,503 | 464 | 🟠 HIGH |
| /themes/labor-wages | 6,601 | 53 | 5,251 | 287 | 🟠 HIGH |
| /areas/27000 | 6,526 | 61 | 3,601 | 338 | 🟡 MEDIUM |
| /blog/telework-gap-tokyo-6x | 6,451 | 53 | 4,951 | 457 | 🟡 MEDIUM |
| /areas/01000 | 6,301 | 72 | 2,251 | 177 | 🟡 MEDIUM |
| /themes/population-dynamics | 5,104 | 61 | 3,604 | 300 | 🟡 MEDIUM |

#### Desktop (7/19 URL 違反 🟠)

| URL | LCP (ms) | Perf | 重要度 |
|---|---:|---:|---|
| /areas/01000 | 3,627 | 49 | 🟠 HIGH |
| /areas/47000 | 3,598 | 49 | 🟠 HIGH |
| /ranking/total-population | 3,362 | 35 | 🟠 HIGH |
| /areas/27000 | 3,344 | 57 | 🟠 HIGH |
| /areas/13000 | 3,237 | 51 | 🟠 HIGH |
| /areas | 3,100 | 72 | 🟠 HIGH |
| / (home) | 3,019 | 56 | 🟠 HIGH |
| /themes/local-economy | 2,503 | 50 | 🟡 |
| /themes/labor-wages | 2,502 | 50 | 🟡 |
| /ranking/agricultural-output | 2,488 | 47 | 🟡 |
| /ranking/annual-sunshine-duration | 2,601 | 47 | 🟡 |
| /ranking/future-population-change-rate-2050 | 2,395 | 55 | 🟡 |
| /themes/population-dynamics | 2,274 | 55 | 🟡 |
| /ranking | 1,062 | 87 | ✅ |
| /themes | 1,320 | 76 | ✅ |
| /search | 1,220 | 90 | ✅ |
| /blog | 962 | 89 | ✅ |
| /blog/telework-gap-tokyo-6x | 1,121 | 67 | ✅ |
| /about | 1,101 | 76 | ✅ |

**閾値**: Mobile LCP ≤ 2,500ms / Desktop LCP ≤ 2,000ms / Performance ≥ 80 / FCP ≤ 1,800ms / TBT ≤ 300ms
**ソース**: `.claude/state/metrics/psi/psi-batch-2026-05-09T17-40-53.json`

### 1.2 LCP 要素特定結果(Mobile)

| 類型 | URL 数 | LCP element | render delay 帯 |
|---|---:|---|---|
| **Cookie banner 起点** | 8 | `body.antialiased > div.fixed > div.container > p` ("当サイトでは…") | 5,564〜9,168ms 🚨 |
| Theme 説明文 (SSR `<p>`) | 4 | `main.flex-1 > div.container > div.mb-6 > p.mt-2` | 2,969〜4,278ms |
| h1/h2 (SSR タイトル) | 3 | `h1.text-2xl` / `h2.text-2xl` | 1,248〜3,299ms |
| Blog/About 本文 (SSR `<p>`) | 2 | `article.prose > p.my-3` / `p.text-xs` | 1,244〜2,302ms |
| Search placeholder | 1 | `div#placeholder` | 2,366ms |
| Blog list image | 1 | `img.object-cover` | 2,367ms |
| Leaflet tile | 1 | `img.leaflet-tile` (`/ranking/annual-sunshine-duration`) | resourceLoadDelay 1,956ms + render 2,399ms |
| ※ N/A (取得失敗) | 1 | `/ranking/agricultural-output` | - |

**Desktop の追加観察**:
- Desktop でも `/`, `/areas`, `/areas/*` で Cookie banner が LCP (3,019〜3,627ms)
- ranking 詳細・theme 詳細では **Leaflet tile が LCP** (`img.leaflet-tile`、tile URL `/tiles/light_all/5/27/12.png`)
- Desktop /ranking は SSR の `span.text-sm` (FeaturedRankings) が LCP で **1,062ms** ✅(SSR ベースの軽い LCP)

### 1.3 ボトルネック構造

**ボトルネック A: JS hydration 遅延(最重要)**
- LCP 要素 = Cookie banner は SSR で出ない(useEffect で setVisible)
- Mobile CPU では JS parse/exec が遅く、`useEffect → setState → re-render` までに 5〜9 秒
- `apps/web/src/lib/analytics/components/CookieConsentBanner.tsx:40-48` の `useEffect` 即時実行

**ボトルネック B: AdSense bundle 肥大化(2026-05-08 以降)**
- 2026-05-08 19:38 PR #238 (commit `345577c2`): `/ranking/*`, `/areas/*`, `/survey/*` に AdSense 配置
- 2026-05-08 19:45 PR #239 (commit `0b370fa4`): ランキング一覧・比較ページに追加
- 2026-04-末以降の PR #269 で blog 記事内 AdSense (`in-article` / `fluid`) も追加
- `AdSenseScript.tsx` は setTimeout 3000ms + requestIdleCallback で遅延ロード済みだが、bundle は main chunk に
- `AdSenseAd.tsx` は IntersectionObserver lazy ロード済みだが、`'use client'` で React hydration が必要

**ボトルネック C: Leaflet tile(ranking 詳細・theme 詳細のみ)**
- `RankingMapChartClient.tsx:32` で `dynamic(ssr:false)` 化済みだが、Leaflet tile が画面上部にあるため LCP 候補
- Mobile では Leaflet init + tile fetch が 2 秒以上、Desktop でも 2.2〜2.5 秒
- ranking 詳細 4 URL すべて Desktop LCP 違反の主因

**ボトルネック D: Cloudflare 配信層・bundle 構成の最適化余地**
- `next.config.ts:44-54` で `images.unoptimized: true`(Cloudflare Image Resizing 未活用)
- `Cache-Control` が `max-age=0, s-maxage=86400` → repeat visit でブラウザキャッシュ無効
- KaTeX(300KB)が main chunk に含まれる可能性
- D3 vendor chunk は分離済 (`next.config.ts:283-301`)

---

## 2. 過去の試み(学習資産)

### Baseline (2026-03-27〜28)
- ホームページ Mobile/Desktop LCP 9,993ms / Perf 59
- `/areas/13000` で TTFB 22,082ms の異常値(計測時のコールドスタートか)
- 取得手段: `/lighthouse-audit` (PageSpeed Insights API)
- `.claude/skills/analytics/performance-improvement/snapshots/2026-03-27/` 〜 `2026-03-28/`

### 試み 1: TopoJSON client fetch 化 (PR #75) — **ADVERSE**
- 内容: TopoJSON を HTML inline から client fetch に変更し HTML 数百 KB 削減
- 結果: **LCP 12.5s → 19-20s に悪化**(4 回 PSI で確認)
- 理由: LCP 要素が Leaflet map tile (JS 描画依存) → tile URL 発見が JS 実行後 → 余計な fetch round-trip 増えただけ
- 対応: revert で baseline 復旧
- **教訓**: HTML 削減 ≠ LCP 改善。LCP 要素が JS 描画依存ならむしろ逆効果
- ソース: GitHub Issue #74, memory `feedback_lcp_optimization.md`

### 試み 2: Resource preload (PR #102) — **PARTIAL / net 不変**
- 内容: 初期 4 タイルを `<link rel="preload" as="image" fetchpriority="high">` で SSR から hint
- 結果: 
  - resourceLoadDelay: 4,347ms → 2,106ms(**▲ 半減 = preload は機能した**)
  - elementRenderDelay: 597ms → 3,072ms(**▼ 増加**)
  - **net LCP 不変**(noise レベル)
- 理由: tile が cache 済みでも Leaflet が DOM に配置・描画する時間が伸びるだけで打ち消し
- **教訓**: 「LCP 要素が JS 生成画像」なら resource preload だけでは net LCP は動かない
- ソース: GitHub Issue #101, memory `feedback_lcp_optimization.md`

### 試み 3: Cookie banner setVisible を 4s 遅延 (EXP-003) — **一時 EFFECT/FULL → AdSense で REVERT**
- 内容: `CookieConsentBanner` の `setVisible(true)` を 4 秒遅延し、LCP 計測ウィンドウから banner を外す
- 想定: stats47.jp/ mobile LCP 8,251ms → 2,500ms 以下 (-69%) / 根拠: PSI 2026-04-25 で LCP element を CookieConsentBanner と特定、render delay 3,075ms
- 結果:
  - 2026-05-07 計測: **LCP 785ms 達成(effect/full)**
  - 2026-05-08 計測: **LCP 19,727ms に急悪化**(同日 AdSense 広告枠追加 PR #238/#239 デプロイ)
  - 現状(2026-05-09): Cookie banner が再び LCP 要素として観測
- 推定: AdSense 追加で JS bundle 肥大化 → React hydration が遅延 → Banner の `setVisible` トリガーまでの実時間が延長(あるいは現在 4s 遅延コードが revert / 修正されている可能性)
- **教訓**: 単発施策で一時改善しても、他施策が hydration を圧迫すれば LCP は元に戻る。**`hydration コスト全体の管理`** が必要
- 確認: 現在の `CookieConsentBanner.tsx:40-48` は `useEffect` で即時 `setVisible(true)`。**4 秒遅延は現状コード上に存在しない**(revert か別実装に置き換え済み)
- ソース: improvement-log.md EXP-003, Agent 1 (Explore) レポート

### 共通原則(過去 3 試行から導出)
1. **LCP 要素を Lighthouse audit で特定してから施策を立てる**(`fetch-psi-audit.mjs` の `lcp-breakdown-insight` を参照)
2. **breakdown の 4 値 (TTFB / resourceLoadDelay / resourceLoadDuration / elementRenderDelay) のうち、どこを縮めるかを明示する**
3. **施策後 4-7 日以内に PSI 再計測し、effect を判定する**(`.claude/rules/evidence-based-judgment.md`)
4. **デプロイ後に他施策が同じ指標に影響しないか監視**(本件のように相互干渉が起こる)

---

## 3. 改善策カタログ(網羅型)

> 各方策に: **想定効果 / 実装コスト(S/M/L) / リスク / 依存関係 / 過去事例**
>
> 想定効果は「Mobile LCP 改善幅」を主軸に。根拠列に過去 PSI 事例 / web.dev 仕様 / 計算式を明記。

### A. Cookie banner 対策 — 主要 8 URL で最大効果

| ID | 方策 | 想定効果 (Mobile LCP) | コスト | リスク | 依存 / 注意 |
|---|---|---|---|---|---|
| A1 | Banner を SSR で render、初期 `visibility: hidden`、JS で `visible` 切替 | 16,000ms → 4,000ms 程度(主要 8 URL) [根拠: visibility:hidden は LCP 計測対象外、SSR text は他 SSR 要素に LCP 譲渡] | M | hydration mismatch 注意、SSR/CSR で `visible` state を厳密管理 | Cookie 値読み出しを cookies() (server) で行えば SSR 安全 |
| A2 | Banner を Modal / Portal 化(`createPortal` で `<body>` 末尾に挿入) | 同上 [根拠: portal 内要素は通常レイアウトツリー外、LCP 候補から除外されるケースあり] | M | portal でも viewport 内に描画されれば LCP 候補になる、検証必要 | `react-dom` の `createPortal`、SSR では空 |
| A3 | `content-visibility: auto` を Banner コンテナに付与 | 16,000ms → 8,000ms(部分効果) [根拠: web.dev content-visibility 解説、render 後回しで LCP 候補から除外可能] | S | Safari 対応(`@supports`)、CLS 悪化リスク | CSS のみ、ブラウザ対応 95%+ |
| A4 | EXP-003 の 4s 遅延を再実装、ただし AdSense 軽量化と同時 | 一時的に 785ms 達成実績あり、AdSense 軽量化なしでは revert する [根拠: 過去施策 3、2026-05-07 計測] | S | B 群と組み合わせないと意味なし、単独実装は禁止 | **B1 + B5 と同 PR で実装** |
| A5 | Banner `<p>` テキストを SSR で空、マウント後 textContent fill | 5,000ms → 2,000ms 程度 [根拠: テキストサイズが LCP candidate score に影響、空 text は通常 LCP 候補から外れる] | S | UX上の Cookie 告知が遅延 = GDPR/法令上問題なし(同意取得自体は banner UI 出現後) | A1/A2 のバリエーション |
| A6 | Banner を `next/dynamic(ssr:false)` + `loading="lazy"` 化 | 12,000ms → 6,000ms(中程度) [根拠: dynamic component は JS hydrate 後に描画開始、LCP 候補から外れる] | S | dynamic import 自体の overhead は小さい | banner ファイルを `'use client'` のままで OK |

**推奨**: **A1**(SSR 静的化 + visibility 切替)が確実性高い。A2 は portal で「ツリー外」化できるが LCP 算定上は viewport 内描画なら候補になる場合あり、計測検証必須。A4 は B 群と同時にしないと逆効果。

### B. AdSense / Hydration 軽量化 — 2026-05-08 悪化への直接対策

| ID | 方策 | 想定効果 | コスト | リスク | 依存 / 注意 |
|---|---|---|---|---|---|
| B1 | `AdSense` JS chunk を vendor-adsense として分離(webpack splitChunks) | -300ms hydration(全 URL) [根拠: D3 chunk 分離の前例、`next.config.ts:283-301`] | M | next.config.ts 編集、bundle analyze で確認 | 既存 D3 分離パターンを踏襲 |
| B2 | AdSenseAd を server placeholder + 完全 lazy hydrate(`React.lazy` + Suspense) | -500ms hydration [根拠: React 公式 lazy load パターン] | M | placeholder の minHeight は維持(CLS 0.732 対策) | `apps/web/src/lib/google-adsense/components/AdSenseAd.tsx` 改修 |
| B3 | AdSenseScript の `setTimeout` を 3s → 5s + scroll trigger | -200ms LCP 候補(間接) [根拠: Idle 時間延長で main thread 余裕、ただし収益 -5% リスク] | S | AdSense 表示遅延 → AdSense 収益が 5-10% 下がる可能性 | `AdSenseScript.tsx:46` の delay 値変更 |
| B4 | AdSense を Consent 取得後にのみ load(Consent Mode v2 連携) | -800ms 初回 LCP [根拠: AdSense 公式 Consent Mode v2 推奨フロー] | M | Consent 拒否ユーザーには広告非表示 = 収益減 | `CookieConsentBanner` と統合、`gtag consent update` 後に AdSense 起動 |
| B5 | AdSense 広告密度を 1 ページ 1-2 個に削減 | -300ms hydration(複数広告枠ページ) [根拠: AdSenseAd 1 個あたり ~20KB JS、hydration cost 比例] | S | 広告収益 -15-30% リスク | `apps/web/src/app/ranking/*`, `/areas/*` の `<AdSenseAd />` 設置箇所削減 |
| B6 | AdSense を Partytown / web worker 経由で隔離 | -1,000ms main thread block [根拠: Partytown 公式ベンチ、3rd party scripts 隔離で TBT 大幅削減] | L | 実験的、AdSense との互換性検証必要、設定難 | `@builder.io/partytown`、Cloudflare Pages 対応 |
| B7 | `AdSenseScript` を `<head>` ではなく `<body>` 末尾に移動 | -100ms FCP [根拠: render-blocking script の位置、ただし AdSenseScript は async なので影響小] | S | 効果限定的 | `apps/web/src/app/layout.tsx` の AdSenseScript 配置 |

**推奨**: **B1 + B5** が確実性高い。B4 は consent 連携で実装複雑だが UX/コンプライアンス的にもベスト。B6 は L 工数だが、TBT 削減も狙えるなら検討。

### C. LCP 要素を SSR 確定要素に置き換え

| ID | 方策 | 想定効果 | コスト | リスク | 依存 / 注意 |
|---|---|---|---|---|---|
| C1 | Hero (FeaturedRankings SVG tile) を明確に LCP 最大要素にする(viewport 上部・大きく) | Mobile LCP 4,000ms → 2,500ms [根拠: SSR SVG は HTML parse 直後に描画、Desktop /ranking で 1,062ms ✓ 実績] | M | A1 と組み合わせて初めて効果(A 必須) | `apps/web/src/features/ranking/components/FeaturedRankings/` |
| C2 | h1 タイトルを font-size 拡大、bold/dark で LCP candidate score 上げ | LCP 6,000ms → 4,000ms(theme 詳細) [根拠: LCP candidate score はサイズと色コントラストに依存、h1 を 36px → 48px 等] | S | デザイン変更、視覚調整必要 | melta-ui デザイン規約準拠で |
| C3 | SSR で hero 画像(OGP / カテゴリビジュアル)を above-the-fold に配置 | LCP 5,000ms → 2,000ms(カテゴリページ) [根拠: SSR `<img>` with `priority` は最速 LCP] | M | 画像生成・配信パイプライン整備、画像 byte size 注意 | `next/image` + Cloudflare Image Resizing |
| C4 | 各ページに「LCP 専用 SSR 要素」を意図的に挿入(明示的 LCP)、デザイン上意味のある hero 要素として | LCP 6,000ms → 2,500ms [根拠: LCP element の制御が完全に手中に] | M | 全ページデザインの統一性 | A 群と組み合わせ |

**推奨**: **C1**(既存 FeaturedRankings を活用)が最低コスト。C2 は補助的に。C3 は他にもメリット(SEO, OGP)あり推奨。

### D. Leaflet — ranking 詳細・theme 詳細の二次対策

| ID | 方策 | 想定効果 | コスト | リスク | 依存 / 注意 |
|---|---|---|---|---|---|
| D1 | tile preload 強化(既実装、`apps/web/src/app/ranking/[rankingKey]/page.tsx:247-255`) | resourceLoadDelay -50% [根拠: 試み 2 の実績、ただし elementRenderDelay 増で net 効果限定] | S | net LCP は動かない可能性大(過去事例) | EXP-003 PARTIAL の教訓を念頭に |
| D2 | Leaflet を静的 SVG/PNG fallback に置換(SSR で render) | Mobile LCP 12,000ms → 3,000ms [根拠: SSR SVG なら hydration 不要、Desktop /ranking 1,062ms 実績の応用] | L | 既存 Leaflet interaction(zoom/pan) の喪失、UX 検討必要 | `packages/visualization` で SSR map component 新設 |
| D3 | Static tile generation(build 時に PNG 化して `/tiles/static/` で配信) | resourceLoadDuration -300ms [根拠: cartocdn 経由 → 自前 CDN で latency 削減] | L | build パイプライン整備、ストレージ追加 | Cloudflare R2 配信 |
| D4 | Leaflet を below-the-fold に下げて LCP 候補から除外 | Mobile LCP 12,000ms → 6,000ms(theme/ranking 詳細) [根拠: viewport 外要素は LCP 候補から外れる] | S | デザイン変更、要素順序入れ替え | ranking 詳細・theme 詳細ページレイアウト調整 |
| D5 | Leaflet を Suspense fallback 後ろにして優先度落とし | Mobile LCP 11,921ms → 9,000ms(部分) [根拠: Suspense boundary 内は LCP candidate score 低下] | S | Suspense fallback のサイズが大きいと逆効果 | 既存 `RankingMapChart` の Suspense 構造拡張 |
| D6 | Mobile では Leaflet を静止画 PNG に置換(User Agent / viewport で分岐) | Mobile LCP 12,000ms → 4,000ms [根拠: D2 の mobile only バリエーション] | M | UA sniff の保守性、Cloudflare Worker で分岐 | Edge Middleware 活用 |

**推奨**: **D4 + D5**(レイアウト変更だけで効果)を先に。D2/D3 は D4/D5 で目標未達なら検討。

### E. インフラ・配信層(横断)

| ID | 方策 | 想定効果 | コスト | リスク | 依存 / 注意 |
|---|---|---|---|---|---|
| E1 | Cloudflare Image Resizing 有効化(`next.config.ts:44` の `unoptimized: true` を解除) | Mobile LCP -500ms(画像 LCP URL) [根拠: 画像 byte size 30-50% 削減、Cloudflare 公式] | M | Cloudflare Workers 設定変更必要、コスト追加(1M req/月 \$5) | `next.config.ts` + Workers 設定 |
| E2 | Cache-Control max-age=0 → 1h(repeat visit 改善) | repeat visit LCP -2,000ms [根拠: browser cache hit、初回後の JS/CSS 再取得回避] | S | キャッシュ無効化フローの設計 | `apps/web/src/middleware.ts` or Cloudflare headers |
| E3 | SWC minify 確認(Next 15 でデフォルト ON だが要検証) | JS download -3% [根拠: Terser → SWC で 2-5% 削減実績] | S | next.config.ts 設定で明示 ON | `swcMinify: true` |
| E4 | Worker KV による R2 fetch キャッシュ層 | TTFB -200ms(動的ページ) [根拠: KV 経由は R2 直アクセスより早い場合あり、エッジ近接] | M | KV binding 追加、容量制約(25MB/value) | wrangler.toml + middleware |
| E5 | KaTeX を blog 専用 lazy chunk 化 | 非 blog ページ JS -300KB [根拠: KaTeX deps size、blog 以外で不要] | S | blog 記事内 KaTeX 描画タイミング | dynamic import in blog page |
| E6 | `next/font` preload を selective 化(Inter は home のみ preload, Noto Sans JP は preload=false 維持) | LCP -100ms(font swap 早期化) | S | font 表示の一貫性検証 | `apps/web/src/lib/fonts/index.ts:13-43` |
| E7 | Brotli 圧縮確認(Cloudflare Pages デフォルト ON のはず) | JS/CSS -30-40% 圧縮 [根拠: Cloudflare 公式] | S | 既に ON の可能性大、確認のみ | Response header `content-encoding: br` 確認 |
| E8 | ISR revalidate を granular 化(category 1h / ranking 24h / blog 7d) | edge cache hit rate +30% [根拠: 変更頻度に応じた TTL 設定] | M | 全ページの `revalidate` 設定見直し | `apps/web/src/app/**/page.tsx` |
| E9 | Cache Rules で aggressive caching(`/api/snapshot/*` 24h, `/_next/image/*` 7d) | edge hit rate +40% [根拠: Cloudflare Cache Rules 公式] | S | Cloudflare Dashboard 設定 | コード変更なし |
| E10 | Preconnect / dns-prefetch を必要ページのみに(non-map ページから削除) | DNS lookup -50-100ms(map なしページ) [根拠: 不要 DNS 解決の削除] | S | conditional `<link>` 出力ロジック | `apps/web/src/app/layout.tsx:76-98` |
| E11 | `<head>` 内の Google Analytics / NextTopLoader 等の script 最適化(defer / async / 削除) | TBT -100ms | S | サードパーティ依存、A/B 比較 | `apps/web/src/app/layout.tsx:103-151` |

**推奨**: **E1 + E2 + E5** が安全かつ高効果。E9 は設定のみ。E4(KV)はオーバーキル感あるが将来検討。

### F. Mobile 特化対策

| ID | 方策 | 想定効果 | コスト | リスク | 依存 / 注意 |
|---|---|---|---|---|---|
| F1 | Mobile breakpoint で重い D3/Leaflet を skip / 簡易版に置換 | Mobile LCP -3,000ms / TBT -1,500ms [根拠: Mobile CPU 性能制約、JS 軽量化で hydration 早期化] | M | Mobile/Desktop で UX 差異 | useMediaQuery / Server Component で viewport 分岐 |
| F2 | Mobile では Leaflet → 静止 PNG fallback(D6 と同じ) | (D6 と同じ) | M | (D6 と同じ) | D6 参照 |
| F3 | critical CSS inline(above-the-fold のみ) | Mobile FCP -500ms [根拠: render-blocking CSS の inline 化、web.dev 推奨] | M | Next.js は自動で critical CSS 抽出するが手動チューニング余地 | `experimental.optimizeCss: true` 試行 |
| F4 | JS bundle splitting で mobile に不要な component を分離(管理者画面・GES 系) | Mobile JS -200KB | M | route-based code split は既に標準 | 個別 component の dynamic import 拡張 |
| F5 | Mobile Optimized Page を `/m/` で別配信(最終手段、SSR 軽量化) | Mobile LCP -50% [根拠: AMP 類似、minimal HTML 配信] | XL | 別配信パイプライン、SEO 影響、保守 2 倍 | 最後の手段 |

**推奨**: **F1** を Phase 2 で。F5 は通常採用しない。

### G. 監視・運用

| ID | 方策 | 効果 | コスト | リスク |
|---|---|---|---|---|
| G1 | Lighthouse CI を GitHub Actions に組み込み(PR 単位で Mobile LCP / Perf を CI 表示) | 悪化の早期検知 | M | Lighthouse CI 設定、PR コメント連携 |
| G2 | URL Inspection API で再クロール検証(既存 `.claude/scripts/gsc/url-inspection-daily.cjs`) | Google 認識との乖離検知 | S | 既存スクリプト活用 |
| G3 | PSI 日次 batch の閾値違反通知強化(Issue 自動起票は実装済、Slack 通知追加) | 違反検知の即時性 | S | webhook 設定 |
| G4 | Cloudflare Web Analytics で実ユーザー LCP 観測(Lab data と CrUX の乖離把握) | 実ユーザー体感の把握 | S | 既に Cloudflare Web Analytics 有効? 確認必要 |
| G5 | PR ごとに psi-batch 自動取得 + diff 表示(GitHub Actions) | 施策効果の即時確認 | M | PR comment / commit status |
| G6 | Performance Budget の自動チェック(`budgets.json` を CI で参照、違反で警告) | budget 違反 PR の検知 | S | 既存 budgets.json 活用 |

**推奨**: **G1 + G5** で施策 PR の品質担保。G6 は budget 整備済なら即適用可。

---

## 4. 推奨実装フェーズ

### Phase 1: Cookie banner + AdSense 緊急対応 (1 週間 / 最大インパクト)
**狙い**: 主要 8 URL の Mobile LCP を 16,000ms → 4,000ms 以下に。Cookie banner 起点の LCP を一掃する。

**実装**:
- **A1**: Cookie banner を SSR で render し、`visibility: hidden` 初期 + JS で `visible` 切替
- **B1**: AdSense JS chunk を vendor-adsense として分離
- **B5**: AdSense 広告密度を 1 ページ 1-2 個に削減(ranking 一覧 / areas / themes のみに限定)

**検証期日**: 2026-05-23 朝 PSI 自動計測(GitHub Actions 日次 02:00 JST)
**成功判定**:
- Mobile LCP < 5,000ms(全 URL)→ effect/full
- Mobile LCP < 8,000ms(主要 URL)→ effect/partial
- それ以外 → 仮説再検証
**撤退条件**: 施策後 8 日経過で Mobile LCP 平均 -30% 未満なら即 revert

### Phase 2: LCP 要素転換 + インフラ最適化 (2-3 週間)
**狙い**: Mobile LCP を 4,000ms → 2,500ms 達成、Performance スコア 60→80。

**実装**:
- **C1**: FeaturedRankings SVG を明確に LCP 最大要素に
- **E1**: Cloudflare Image Resizing 有効化
- **E2**: Cache-Control max-age=0 → 1h
- **E5**: KaTeX を blog 専用 lazy chunk 化
- **E10**: Preconnect / dns-prefetch を必要ページのみに

**検証期日**: Phase 1 完了 + 14 日後
**成功判定**:
- Mobile LCP < 2,500ms(全 URL)→ effect/full
- Performance ≥ 80(全 URL)→ ボーナス
**撤退条件**: 各施策単独で LCP が悪化したら個別 revert

### Phase 3: 個別ページ最適化 (3-4 週間)
**狙い**: ranking 詳細・theme 詳細の Leaflet 起点 LCP 対応、mobile 全体の細部チューニング。

**実装**:
- **D4 + D5**: Leaflet を below-the-fold に下げ + Suspense 後ろに置く
- **D2**(D4/D5 で目標未達なら): Leaflet → SSR SVG fallback
- **F1**: Mobile breakpoint で重い D3/Leaflet を簡易版に置換
- **C2**: h1 タイトル font-size 調整

**成功判定**: Mobile Performance ≥ 90(全 URL)

### Phase 4: 継続監視 (恒久)
- **G1**: Lighthouse CI を PR に組み込み
- **G5**: PR ごとに psi-batch 自動取得 + diff 表示
- **G6**: Performance Budget の自動チェック
- 月次 PSI レビューで悪化検知(`/performance-improvement` スキル週次運用)

---

## 5. 検証コマンド集

### PSI 単発計測 (curl)
```bash
# Mobile
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/&strategy=mobile&category=performance" \
  | jq '.lighthouseResult.audits["largest-contentful-paint"].numericValue,
        .lighthouseResult.audits["largest-contentful-paint-element"].details.items[0].node'

# Desktop
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/&strategy=desktop&category=performance" \
  | jq '.lighthouseResult.audits["largest-contentful-paint"].numericValue'
```

### LCP breakdown 詳細取得
```bash
node .claude/scripts/psi/fetch-psi-audit.mjs \
  --urls "https://stats47.jp/,https://stats47.jp/ranking,https://stats47.jp/areas" \
  --strategy mobile \
  --out /tmp/psi-after.json

jq -r '.results[] | "\(.url) LCP=\(.lab_data.LCP_ms | floor)ms elem=\(.lcp_element.selector) renderDelay=\(.lcp_element.breakdown_ms.elementRenderDelay)"' /tmp/psi-after.json
```

### URL Inspection API(Google 認識との乖離検知)
```bash
node .claude/scripts/gsc/url-inspection-daily.cjs --limit 10
```

### 各 Phase 完了時の判定スクリプト
```bash
# 前後比較
jq -s '
  def url_lcp(d): [d.results[] | select(.strategy=="mobile") | {url, lcp: .lab_data.LCP_ms | floor}];
  {before: url_lcp(.[0]), after: url_lcp(.[1])} |
  {diff: (.after | map({url, after_lcp: .lcp})) | map(. + {before_lcp: (.url as $u | $before[] | select(.url==$u).lcp)})}
' .claude/state/metrics/psi/psi-batch-2026-05-09T17-40-53.json /tmp/psi-after.json
```

### Performance Budget 違反確認
```bash
node .claude/scripts/psi/check-budgets.mjs \
  --psi-batch /tmp/psi-after.json \
  --budgets .claude/skills/analytics/performance-improvement/budgets.json
```

---

## 6. 失敗判定 / 撤退条件(共通)

### 各施策の effect 判定 4 状態
- **effect/full**: 想定値の 80% 以上達成(7-14 日経過後)
- **effect/partial**: 想定値の 30-80% 達成
- **effect/none**: 想定値の 0-30%(noise 圏)
- **effect/adverse**: LCP / Perf がベースラインより悪化 → **即 revert**

### 撤退条件
- 各 phase 完了後 8 日経過で目標未達 → 仮説再検証(Lighthouse audit から再開)
- LCP が悪化したら 24 時間以内に revert(EXP-002 ADVERSE の教訓)
- elementRenderDelay が施策前より +500ms 以上増加したら警告(EXP-003 PARTIAL の教訓)
- 同時に複数施策を入れて effect 判定不能になったら、施策を 1 つに絞って再実施

### NG ワード(改善ログ記入時の禁止表現)
`.claude/rules/evidence-based-judgment.md` 参照。「のはず」「兆候」「浸透待ち」「だろう」「と考えられる」等は使用禁止。代わりに「[仮説]」「検証コマンド」「検証期日」の 3 点セットで書く。

---

## 7. 関連ファイル・参照

### 計測データ
- `.claude/state/metrics/psi/LATEST.md` — 最新計測サマリー
- `.claude/state/metrics/psi/psi-batch-2026-05-09T17-40-53.json` — 本ドキュメントのベースデータ
- `.claude/state/metrics/psi/history.csv` — 時系列推移
- `.claude/skills/analytics/performance-improvement/budgets.json` — 閾値定義
- `.claude/skills/analytics/performance-improvement/snapshots/YYYY-MM-DD/metrics.csv` — 過去 snapshot

### 過去履歴・知見
- `.claude/skills/analytics/performance-improvement/reference/improvement-log.md` — EXP 全履歴
- `~/.claude/projects/-Users-minamidaisuke-stats47/memory/feedback_lcp_optimization.md` — LCP 改善原則(EXP-002/003 反省)
- GitHub Issues #74(試み 1: TopoJSON client fetch ADVERSE), #101(試み 2: Resource preload PARTIAL)

### 現状コード(改修対象)
- `apps/web/src/lib/analytics/components/CookieConsentBanner.tsx:37-92` — Cookie banner(A 群対象)
- `apps/web/src/lib/google-adsense/components/AdSenseScript.tsx:18-53` — AdSense script(B3, B6, B7)
- `apps/web/src/lib/google-adsense/components/AdSenseAd.tsx:34-180` — AdSense Ad(B2, B5)
- `apps/web/src/app/layout.tsx:76-151` — preconnect / GA / NextTopLoader(E10, E11)
- `apps/web/next.config.ts:44-54, 283-301` — image / D3 chunk(E1, E3, B1)
- `apps/web/src/lib/fonts/index.ts:13-43` — font config(E6)
- `apps/web/src/app/page.tsx:85-121` — Hero / FeaturedRankings(C1)
- `apps/web/src/features/ranking/components/FeaturedRankings/index.tsx:29-140` — FeaturedRankings(C1)
- `apps/web/src/features/ranking/components/RankingMapChart/RankingMapChartClient.tsx:32-40` — Leaflet dynamic(D 群)
- `apps/web/src/app/ranking/[rankingKey]/page.tsx:247-255` — tile preload(D1)

### 既存スキル・スクリプト
- `.claude/skills/analytics/performance-improvement/SKILL.md` — 改善ループ運用
- `.claude/scripts/psi/fetch-psi-audit.mjs` — PSI 計測スクリプト(LCP breakdown 抽出済)
- `.claude/scripts/gsc/url-inspection-daily.cjs` — URL Inspection API

### 規約
- `.claude/rules/evidence-based-judgment.md` — 実証ベース判定ルール
- `.claude/rules/coding-standards.md` — TypeScript/React/Next.js コーディング標準
- `CLAUDE.md` — プロジェクト規約

---

## 付録: LCP 要素の詳細(全 19 URL Mobile)

| URL | LCP (ms) | LCP element | render delay (ms) |
|---|---:|---|---:|
| / | 16,426 | Cookie banner `<p>` | 8,016 |
| /ranking | 19,051 | Cookie banner `<p>` | 5,564 |
| /areas | 13,805 | Cookie banner `<p>` | 9,168 |
| /ranking/total-population | 14,691 | Cookie banner `<p>` | 6,664 |
| /areas/13000 | 14,020 | Cookie banner `<p>` | 6,177 |
| /areas/47000 | 14,035 | Cookie banner `<p>` | 6,777 |
| /themes | 6,904 | Theme intro `<p>` | 457 |
| /themes/population-dynamics | 5,104 | Theme intro `<p>` | 2,969 |
| /themes/local-economy | 7,801 | Theme intro `<p>` | 3,583 |
| /themes/labor-wages | 6,601 | Theme intro `<p>` | 4,278 |
| /ranking/future-population-change-rate-2050 | 8,701 | `h1.text-2xl` | 3,299 |
| /areas/27000 | 6,526 | `h2.text-2xl` | 1,248 |
| /areas/01000 | 6,301 | `h2.text-2xl` | 1,276 |
| /search | 7,201 | search input `#placeholder` | 2,366 |
| /ranking/annual-sunshine-duration | 11,921 | Leaflet tile `img` | 2,399 (+ resourceLoadDelay 1,956) |
| /ranking/agricultural-output | 12,001 | N/A | N/A |
| /blog | 9,151 | Blog list `img.object-cover` | 2,367 |
| /blog/telework-gap-tokyo-6x | 6,451 | Blog body `<p>` | 1,244 |
| /about | 8,916 | About `<p>` | 2,302 |

**観察**:
- 主要 6 URL(/ /ranking /areas /ranking/total-population /areas/13000 /areas/47000)はすべて **Cookie banner が LCP**(render delay 5,564〜9,168ms)
- ranking 詳細では Leaflet と h1 が混在(LCP candidate が試行ごとに変動)
- theme 詳細 3 URL は SSR text が LCP(render delay 2,969〜4,278ms = hydration 待ち)
- blog 一覧は image LCP、blog 詳細は本文 `<p>` LCP

**結論**: **Cookie banner 対策(A 群)が最大 ROI**。次に theme 詳細・blog の SSR text の render delay を縮める(B 群 hydration 軽量化)。Leaflet 関連は二次。
