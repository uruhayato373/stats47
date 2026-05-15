# PSI / Core Web Vitals 改善ログ

パフォーマンス指標（PSI スコア・Lab data・CrUX 実ユーザー計測）の継続的追跡と改善施策の記録。

> **2026-04-25 確認**: 推測ベース判定の根絶ルール（`.claude/rules/evidence-based-judgment.md`）に基づき本ファイルを点検。NG ワード（「のはず」「兆候」「浸透待ち」等）残存なし。新規エントリは下記テンプレに従うこと。

**運用ルール:**
- Append-only。過去エントリは改変しない
- 日付は絶対日付（YYYY-MM-DD）
- 数値はソース明示（「PSI 2026-03-28 取得 / snapshots/2026-03-28/metrics.csv」）
- 施策とコミット hash をペアで記録
- snapshot ディレクトリは本ログと一緒にコミット
- **想定効果は必ず根拠を併記**（過去事例 / Google 公式ガイド / 計算式）
- **実測値は取得コマンドへのリンク併記**

## 新規エントリテンプレ（必ず参照: `.claude/rules/evidence-based-judgment.md`）

```markdown
### [EXP-NNN] タイトル
- **デプロイ日**: YYYY-MM-DD / コミット: <hash>
- **想定効果**: <定量値> [根拠: <PSI 過去事例 / web.dev URL>]
- **検証コマンド**: `curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/<path>&strategy=mobile"`
- **実測 (before)**: LCP X ms / CLS Y / 取得日 / `snapshots/<date>/metrics.csv`
- **実測 (after)**: LCP X ms / CLS Y / 取得日 / `snapshots/<date>/metrics.csv`
- **判定**: effect/* [根拠: 実測 / 想定 = X%、経過 N 日]
- **未確定 / 仮説**: <あれば「[仮説] 〜 / 検証期日 YYYY-MM-DD」形式>
```

---

## Baseline

**取得日**: 2026-03-27 / 2026-03-28
**ソース**: `snapshots/2026-03-27/metrics.csv`（17 行）, `snapshots/2026-03-28/metrics.csv`（8 行）
**取得手段**: `/lighthouse-audit`（PageSpeed Insights API）

### サンプル（ホームページ・モバイル/デスクトップ両方）

| date | url | strategy | performance | LCP (ms) | CLS | TBT (ms) | TTFB (ms) |
|---|---|---|---:|---:|---:|---:|---:|
| 2026-03-28 | `/` | both | 59 | 9,993 | 0.0002 | 222 | 1,393 |
| 2026-03-28 | `/areas/01000` | both | 58 | 10,495 | 0.000 | 120 | 356 |
| 2026-03-28 | `/areas/13000` | both | 55 | 10,979 | 0.021 | 86 | 22,082 |

### Budget 違反サマリ（budgets.json 基準）

- `all × mobile × lcp_ms <= 2500` **NG**（ほぼ全 URL で 5,000〜11,000ms）
- `all × mobile × score_performance >= 80` **NG**（55〜59）
- CLS は合格圏（ほぼ 0）
- TBT は合格圏（100〜300ms、警告圏が一部）

---

## Action Log

### [EXP-003] Cookie 同意バナーを LCP 候補から外す — setVisible を 4s 遅延

- **デプロイ日**: 2026-04-26 (予定) / コミット: <pending>
- **想定効果**: stats47.jp/ mobile LCP 8,251ms → 2,500ms 以下 (-69%) [根拠: PSI 2026-04-25 で LCP 要素を `body.fixed > div.container > p` (CookieConsentBanner) と特定、render delay 3,075ms。banner を LCP 計測ウィンドウ後に挿入すれば本来意図した FeaturedRankings (`apps/web/src/app/page.tsx:121`) が LCP に戻る]
- **検証コマンド**: `curl 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/&strategy=mobile&category=performance' | jq '.lighthouseResult.audits["largest-contentful-paint"].numericValue, .lighthouseResult.audits["largest-contentful-paint-element"].details.items[0].node.snippet'`
- **実測 (before)**: LCP 8,251ms / FCP 3,751ms / TBT 353ms / Perf 57 / 取得日 2026-04-25 / `.claude/state/metrics/psi/psi-batch-2026-04-25T17-39-06.json`
- **実測 (after)**: <pending — 翌朝 PSI 自動計測待ち>
- **判定**: pending
- **未確定 / 仮説**:
  - **[仮説]** banner を 4s 遅延すれば FeaturedRankings が LCP になる / 検証期日 2026-04-27 / 期日後の判定: LCP < 2,500ms かつ lcp_element が `FeaturedRankings` 配下なら effect/full、LCP < 5,000ms なら effect/partial、それ以外は別の LCP 候補（hero h1 / FCP 自体の遅延）を再調査
  - **[別件]** CrUX TTFB 2,390ms (lab 4ms と乖離) → Cloudflare cache miss path 調査が必要。本 EXP のスコープ外、別 EXP で扱う
- **副次計測**: `/themes/*` `/ranking/*` 詳細ページの LCP も同じ banner が起点になっていれば同程度改善するか合わせて観測（mobile LCP 11,000-15,000ms 帯）

### [EXP-004] CookieConsentBanner SSR 化で LCP 根本解決

- **デプロイ日**: 2026-05-10 / コミット: `02a5ba97`
- **想定効果**: 主要 8 URL Mobile LCP 8,000〜19,000ms → 2,500ms 以下 (-69%) [根拠: PSI 2026-05-09 で LCP 要素を `body.antialiased > div.fixed > div.container > p` (CookieConsentBanner の `<p>`) と特定、elementRenderDelay 5,564〜9,168ms。SSR で banner を確定描画すれば hydration 待ちが消える前提]
- **実装**: `layout.tsx` を async 化 + `cookies()` で `stats47_consent` 読み取り → `CookieConsentBanner` の SSR 制御に渡す
- **検証コマンド**: `node -e "const j=require('/tmp/psi-X.json'); j.results.filter(r=>r.strategy==='mobile').forEach(r=>console.log(r.url, r.lab_data.LCP_ms, r.lcp_element?.selector))"`
- **実測 (before, 2026-05-09)**:
  - `/` 16,426ms (banner LCP, renderDelay 8,016ms)
  - `/ranking` 19,052ms (banner LCP)
  - `/areas` 13,805ms (banner LCP)
  - `/ranking/total-population` 14,691ms / `/areas/47000` 14,036ms / `/blog` 9,151ms
  - ソース: `.claude/state/metrics/psi/psi-batch-2026-05-09T17-40-53.json`
- **後続インシデント**: 同日 commit `ebad87c2` で revert — async `layout.tsx` + `cookies()` が全 route を force-dynamic 化し `ranking/[rankingKey]` SSG が Cloudflare Workers 上で 500
- **教訓**: `layout` または layout 配下の Server Component で `cookies()`/`headers()` を呼ぶと SSG 崩壊 → `.claude/rules/nextjs-ssg-preservation.md` に固定化

### [EXP-004b] CookieConsentBanner 同期 cookie 読み取り最適化

- **デプロイ日**: 2026-05-10 / コミット: `c8a33939`
- **想定効果**: EXP-004 の SSG 崩壊を回避しつつ、`useState(getInitialVisible)` で `document.cookie` を hydration 直後に同期読み取り。LCP elementRenderDelay 8,000ms → 5,000ms (-37%)
- **実装**: `layout.tsx` は sync 維持、`CookieConsentBanner` 単体で `useState` 初期化関数内 `document.cookie` 同期読み取り（`setTimeout` 排除）
- **検証コマンド**: `node -e "const j=require('.claude/state/metrics/psi/psi-batch-2026-05-15T18-01-17.json'); j.results.filter(r=>r.strategy==='mobile').forEach(r=>console.log(r.url, r.lab_data.LCP_ms, r.lcp_element?.selector))"`
- **実測 (after, 2026-05-15)** [`.claude/state/metrics/psi/psi-batch-2026-05-15T18-01-17.json`]:

  | URL (mobile) | LCP 5/9 | LCP 5/15 | Δ | %変化 | LCP elem 5/15 |
  |---|---:|---:|---:|---:|---|
  | / | 16,426 | 8,476 | -7,950 | **-48%** | banner `<p>` (still LCP, renderDelay 5,028ms) |
  | /ranking | 19,052 | 8,101 | -10,950 | **-57%** | banner `<p>` (still LCP) |
  | /areas | 13,805 | 7,504 | -6,302 | **-46%** | banner `<p>` (still LCP) |
  | /ranking/total-population | 14,691 | 9,603 | -5,088 | -35% | (no banner) |
  | /areas/47000 | 14,036 | 7,651 | -6,385 | **-46%** | (no banner) |
  | /blog | 9,151 | 5,928 | -3,223 | -35% | img.object-cover (unchanged) |
  | /search | 7,202 | 5,113 | -2,089 | -29% | - |
  | /themes | 6,905 | 9,546 | **+2,641** | **+38%** | SSR p.mt-1 (no banner) — out of scope |
  | /ranking/future-population-change-rate-2050 | 8,701 | 12,902 | **+4,201** | **+48%** | leaflet-tile (shifted from h1) — out of scope |

- **判定**: **effect/partial** [根拠: 主要 8 URL のうち 6 URL で LCP -29% 〜 -57% 改善、ただし banner は依然 LCP 候補のまま閾値 2,500ms 未達。経過 5 日。banner LCP 撤去は次サイクル PR #283 (A1 visibility:hidden) で実現予定]
- **未確定 / 仮説**:
  - **[仮説]** `/themes` (+38%) `/ranking/future-population-change-rate-2050` (+48%) の悪化は EXP-004 とは別経路。LCP 要素が SSR `<p>` → 同じ SSR `<p>` のまま / leaflet-tile に shift。**[原因候補]** 同期間のコミット `345577c2` AdSense slot 追加 / `0b370fa4` ranking AdSense 配置 / `e30c117f` OGP middleware 修正 のいずれか。検証期日 2026-05-20、検証コマンド: `git log --since=2026-05-10 --until=2026-05-15 --oneline | head -30` + 該当 URL の 5/15 / 5/9 PSI breakdown 比較
  - **[未確定]** banner が依然 LCP 候補 → Cycle 1 PR #283 (visibility:hidden) でこの問題に対処予定。Cycle 1 デプロイ後 4-7 日の PSI で banner が LCP candidate から外れるか確認

### [EXP-005 / Cycle 1] A1 banner SSR + B1 adsense chunk + B5 density 削減

- **デプロイ日**: 未デプロイ (PR #283 develop 待ち) / コミット: `d1a4acb4`
- **想定効果**: 主要 8 URL Mobile LCP 4,000〜10,000ms → 2,500ms 以下 (-50%) [根拠: 改善策カタログ §3.A.A1 — visibility:hidden は Lighthouse LCP candidate scoring から除外仕様 / §3.B.B1+B5 — AdSense JS chunk 分離 + 広告密度削減で hydration 軽量化]
- **実装**:
  - A1: `CookieConsentBanner` を sync Server Component + `CookieConsentBannerClient` (`visibility:hidden` 初期) に分離
  - B1: `next.config.ts` に `adsenseVendor` splitChunk → `vendor-adsense-*.js` 切り出し
  - B5: AdSense slot 3 個削除 (`MAIN_SIDEBAR`, `RANKING_PAGE_TABLE_SIDE`, `RANKING_PAGE_SIDEBAR`) + `AdSenseScript` を 5s setTimeout + 初回ユーザー操作で early-load
  - SSG 検証: `next build` で `● /ranking/[rankingKey]` (1,947+ paths) と `○ /` 全部 Static 維持
- **検証コマンド**: `cat .claude/state/metrics/psi/LATEST.md` (main マージ 4-7 日後)
- **実測 (before)**: 上記 EXP-004b の 5/15 PSI を baseline とする
- **実測 (after)**: <pending — main マージ後 4-7 日の PSI>
- **判定**: pending
- **判定期日**: 2026-05-23 (main マージ + 7 日後)
- **判定基準**:
  - banner LCP candidate から外れた & 主要 8 URL LCP < 5,000ms → **effect/partial 確定、Cycle 2 検討**
  - banner LCP candidate から外れた & 主要 8 URL LCP < 2,500ms → **effect/full**
  - banner が依然 LCP candidate or 主要 URL LCP > baseline → **effect/none or adverse、A2 portal 化 / A3 content-visibility:auto に切替**
- **未確定 / 仮説**:
  - **[仮説]** visibility:hidden で Lighthouse の LCP candidate scoring から除外 / 検証期日 2026-05-23 / コマンド: `node -e "const j=require('/tmp/psi-after.json'); const home=j.results.find(r=>r.url==='https://stats47.jp/'&&r.strategy==='mobile'); console.log(home.lcp_element?.selector)"` → banner `<p>` 以外なら仮説支持
  - **[仮説]** AdSense chunk 分離で TBT 削減 / 検証コマンド: 同 PSI batch の `lab_data.TBT_ms` を 5/15 と比較

### 2026-04-17: 計測データを D1 → ファイルへ移行

- 旧 D1 テーブル `performance_metrics` / `performance_budgets` を `.claude/skills/analytics/performance-improvement/` 配下のファイルに移行
- 理由: 「計測蓄積は .claude/ 配下のファイル」という記録先統一原則（CLAUDE.md §記録先の統一原則）
- 旧データは snapshots/YYYY-MM-DD/metrics.csv として保存、閾値は budgets.json に集約
- コミット: (本コミットで確定)

---

## Observation Log

_（次回 `/lighthouse-audit` 実行後に追記）_

---

## Next Actions

Baseline のデータから以下を優先候補として検討:

1. **LCP 2.5s 達成**: 主要ページ（/, /areas/*）で LCP > 10s が常態化している。画像最適化・JS 削減・SSR データ取得の見直しが必要
2. **Performance スコア 80 達成**: 現状 55〜59。LCP 改善と同時に進行
3. **TTFB 改善**: `/areas/13000` で 22,082ms という異常値あり（計測時のコールドスタートか恒常的か要判定）

次回アクション決定時に `/nsm-experiment propose` から EXP-NNN として登録する想定。
