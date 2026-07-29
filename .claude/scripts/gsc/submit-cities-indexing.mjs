#!/usr/bin/env node
/**
 * submit-cities-indexing.mjs — RETIRED 2026-07-23 (Google Indexing API 準拠是正)
 *
 * ⚠️ cities pages (通常ページ) を Google Indexing API の URL_UPDATED 通知で強制再クロールして
 * いたが、公式仕様に反するため送信コードパス (Indexing API クライアント生成・通知 publish) を撤去した。
 *
 * Google Indexing API の公式対象は JobPosting または BroadcastEvent を含む VideoObject
 * ページのみ (https://developers.google.com/search/apis/indexing-api/v3/quickstart,
 * アクセス日 2026-07-23)。/areas/<code>/cities/<city> は対象外。
 *
 * cities の再クロールは Indexing API 送信ではなく observe-after-fix で行う:
 *   1. sitemap 掲載・内部リンク・canonical・content を整える
 *   2. URL Inspection API で coverageState を観測
 *      → node .claude/scripts/gsc/url-inspection-daily.cjs --limit 50
 *
 * この stub は googleapis を import せず、Indexing API を一切呼ばない。
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md。
 */

const args = process.argv.slice(2);
const wantsExecute = args.includes("--execute");

const NOTICE = [
  "[retired] submit-cities-indexing.mjs は 2026-07-23 に退役しました (Indexing API 準拠是正)。",
  "[retired] cities pages への Indexing API 送信は公式仕様に反するため停止しています。",
  "[retired] 公式対象は JobPosting / BroadcastEvent VideoObject のみ:",
  "[retired]   https://developers.google.com/search/apis/indexing-api/v3/quickstart (アクセス日 2026-07-23)",
  "[retired] 再クロールは observe-after-fix (url-inspection-daily.cjs で観測) を使ってください。",
];

for (const line of NOTICE) console.log(line);

if (wantsExecute) {
  console.error("[retired] --execute は無効です。Indexing API 送信は行いません。");
  process.exit(2);
}

process.exit(0);
