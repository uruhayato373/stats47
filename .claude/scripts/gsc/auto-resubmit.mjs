#!/usr/bin/env node
/**
 * auto-resubmit.mjs — RETIRED 2026-07-23 (Google Indexing API 準拠是正)
 *
 * ⚠️ このスクリプトは通常ページを Google Indexing API の URL_UPDATED 通知で再送信していたが、
 * 公式仕様に反するため送信コードパス (Indexing API クライアント生成・通知 publish) を撤去した。
 *
 * Google Indexing API の公式対象は JobPosting または BroadcastEvent を含む VideoObject
 * ページのみ (https://developers.google.com/search/apis/indexing-api/v3/quickstart,
 * アクセス日 2026-07-23)。stats47 の ranking / area / theme / blog / 410 URL は対象外。
 *
 * 通常ページの再クロールは Indexing API 送信ではなく次で行う (= observe-after-fix):
 *   1. sitemap 掲載整合・内部リンク強化・HTTP status(200/301/410) 修正・canonical 是正・content 補強
 *   2. URL Inspection API で coverageState / lastCrawlTime の遷移を「観測」
 *      → node .claude/scripts/gsc/url-inspection-daily.cjs --limit 50
 *
 * 過去の送信履歴 (.claude/state/metrics/gsc/resubmit-history.json) は証拠として保持する
 * (このスクリプトは書き込まない)。正典: docs/02_実装計画/39 Phase 1 /
 * .claude/skills/analytics/gsc-coverage-remediation/SKILL.md。
 *
 * この stub は googleapis を import せず、Indexing API を一切呼ばない。
 * `--execute` を付けて呼ぶと退役方針を表示して非ゼロ終了する (誤送信を構造的に防ぐ)。
 */

const args = process.argv.slice(2);
const wantsExecute = args.includes("--execute");

const NOTICE = [
  "[retired] auto-resubmit.mjs は 2026-07-23 に退役しました (Indexing API 準拠是正)。",
  "[retired] 通常ページ (ranking/area/theme/blog/410) への Indexing API 送信は公式仕様に反するため停止しています。",
  "[retired] 公式対象は JobPosting / BroadcastEvent VideoObject のみ:",
  "[retired]   https://developers.google.com/search/apis/indexing-api/v3/quickstart (アクセス日 2026-07-23)",
  "[retired] 再クロールは observe-after-fix で行ってください:",
  "[retired]   sitemap/内部リンク/HTTP/canonical/content 修正 → URL Inspection で観測",
  "[retired]   node .claude/scripts/gsc/url-inspection-daily.cjs --limit 50",
];

for (const line of NOTICE) console.log(line);

if (wantsExecute) {
  console.error(
    "[retired] --execute は無効です。Indexing API 送信は行いません。observe-after-fix を使ってください。"
  );
  process.exit(2);
}

process.exit(0);
