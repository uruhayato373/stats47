#!/usr/bin/env node
/**
 * Search Console の read-only アドホック照会。施策の効果判定・原因切り分けの「コピペ再現できる検証コマンド」に使う。
 *
 * 例:
 *   node .claude/scripts/metrics/gsc-query.mjs --start 2026-08-21 --end 2026-09-17 --dims page \
 *     --filter 'page*=/themes/local-finance'
 *   node .claude/scripts/metrics/gsc-query.mjs --start 2026-09-11 --end 2026-09-17 --dims query,page \
 *     --filter 'query*=地方債' --limit 50
 *
 * フィルタ記法は lib/gsc-query.mjs。GSC は取得遅延が約 3 日あるので、期間は週次 snapshot と同じ
 * lib/periods.mjs の窓 (例: rolling28d) に合わせると比較できる。
 * 認証: GOOGLE_SERVICE_ACCOUNT_KEY_JSON env (メモリで渡す・一時ファイルに書かない) または stats47-*.json。
 */
import { google } from "googleapis";
import { resolveServiceAccountKeyFile, toCsv } from "./lib/auth.mjs";
import { buildGscQuery } from "./lib/gsc-query.mjs";

const SITE_URL = "sc-domain:stats47.jp";
const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];
const METRICS = ["clicks", "impressions", "ctr", "position"];

function createAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  if (json) return new google.auth.GoogleAuth({ credentials: JSON.parse(json), scopes: SCOPES });
  return new google.auth.GoogleAuth({ keyFile: resolveServiceAccountKeyFile(), scopes: SCOPES });
}

async function main() {
  const { request, format } = buildGscQuery(process.argv.slice(2));
  const searchconsole = google.searchconsole({ version: "v1", auth: createAuth() });
  const { data } = await searchconsole.searchanalytics.query({ siteUrl: SITE_URL, requestBody: request });
  const rows = (data.rows ?? []).map((row) => ({
    ...Object.fromEntries(request.dimensions.map((d, i) => [d, row.keys?.[i] ?? ""])),
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: Number((row.ctr ?? 0).toFixed(4)),
    position: Number((row.position ?? 0).toFixed(2)),
  }));
  if (format === "json") {
    process.stdout.write(JSON.stringify({ siteUrl: SITE_URL, startDate: request.startDate, endDate: request.endDate, rows }, null, 2) + "\n");
    return;
  }
  process.stdout.write(`# ${SITE_URL} ${request.startDate}..${request.endDate} rows=${rows.length}\n`);
  process.stdout.write(toCsv(rows, [...request.dimensions, ...METRICS]));
}

main().catch((error) => {
  console.error(`[gsc-query] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
