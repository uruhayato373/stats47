---
name: indexing-api-submit
description: RETIRED 2026-07-23。Google Indexing API は公式に JobPosting / BroadcastEvent VideoObject ページ専用で、stats47 の通常ページ (ranking/area/theme/blog/410) には使わない。通常ページの再クロールは observe-after-fix (sitemap/内部リンク/HTTP/canonical/content 修正 + URL Inspection 観測) で行う。過去の送信ログは証拠として保持。
primary_agent: gsc-analyst
status: retired
---

# indexing-api-submit — RETIRED (Google Indexing API 準拠是正)

> **⚠️ このスキルは 2026-07-23 に退役しました。** 通常ページへの Indexing API 送信は行いません。
> 正典: `.claude/skills/analytics/search-growth/reference/platform-contract.md`の
> 「Indexing API準拠」/ `.claude/todo/improvements.md [INDEXING-AUTO-01]`。

## なぜ退役したか (公式仕様)

Google Indexing API の**公式対象は `JobPosting` または `BroadcastEvent` を含む `VideoObject` ページのみ**です
(出典: https://developers.google.com/search/apis/indexing-api/v3/quickstart、アクセス日 2026-07-23。
"Currently, the Indexing API can only be used to crawl pages with either job posting or broadcast event markup.")。

stats47 の ranking / area / theme / blog、および 410 化 URL は**いずれもこの対象に該当しません**。
これらへ `URL_UPDATED` / `URL_DELETED` を送るのは公式仕様外の利用であり、恒常運用の前提にしません。
サービスアカウントの GSC「オーナー」権限を Indexing API 送信のために要求することも、通常運用の前提にしません。

過去 (2026-04〜2026-07) の送信は effect が実証できておらず (INDEXING-AUTO-01 は URL Inspection による
coverageState 遷移の実測を欠いたまま effect/pending だった)、公式仕様外である以上、継続しません。

## 代替: observe-after-fix (通常ページの再クロールを促す compliant な手段)

通常ページを Google に再認識させたいときは、**送信ではなく「直してから観測する」**:

1. **修正 (根本原因を直す)**
   - sitemap 掲載の整合 (`apps/web/src/app/sitemap.ts` / `SITEMAP_RANKING_KEYS`)
   - 内部リンクの強化 (関連導線・カテゴリ/テーマからの被リンク)
   - HTTP status の是正 (生存ページは 200、廃止は 301/410 を正しく返す)
   - canonical の是正 (user canonical と Google canonical の不一致解消)
   - content 補強 (soft-404 / thin 200 を実データで厚くする)
2. **観測 (URL Inspection API)**
   ```bash
   node .claude/scripts/gsc/url-inspection-daily.cjs --limit 50
   ```
   `coverageState` / `lastCrawlTime` / `googleCanonical` の遷移を実測する
   (`.claude/rules/evidence-based-judgment.md` 準拠。「送ったから登録される」ではなく実測で判定)。

この観測は `gsc-url-inspection-daily.yml` (毎日) と統合 search-growth 基盤
(`.claude/skills/analytics/search-growth/`) の `observe-after-fix` フローが担います。
coverage 是正キュー (`build-coverage-queue.mjs`) の旧 `resubmit` action は `observe-after-fix` に改名済みです。

## 保持している証拠 (削除しない)

過去の送信ログは監査証拠として保持します (編集・削除しない):

- `.claude/state/metrics/gsc/resubmit-history.json` (auto-resubmit の累計送信履歴)
- `.claude/skills/analytics/indexing-api-submit/reference/indexing-api-log/YYYY-MM-DD.jsonl` (手動送信ログ)

## 退役したコードパス

- `.github/workflows/gsc-auto-resubmit-daily.yml` — schedule 削除・retired stub 化 (送信しない)
- `.claude/scripts/gsc/auto-resubmit.mjs` — publish path 撤去・retired stub 化
- `.claude/scripts/gsc/submit-cities-indexing.mjs` — publish path 撤去・retired stub 化

## 参照

- 公式制約: https://developers.google.com/search/apis/indexing-api/v3/quickstart (アクセス日 2026-07-23)
- 準拠是正の正典: `.claude/skills/analytics/search-growth/reference/platform-contract.md`
- 代替フロー: `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md` (observe-after-fix)
- 観測実装: `.claude/scripts/gsc/url-inspection-daily.cjs`
