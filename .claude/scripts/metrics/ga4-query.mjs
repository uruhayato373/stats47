#!/usr/bin/env node
/**
 * GA4 Data API の read-only アドホック照会。施策の効果判定・原因切り分けの「コピペ再現できる検証コマンド」に使う。
 *
 * 例:
 *   node .claude/scripts/metrics/ga4-query.mjs --start 2026-08-10 --end 2026-09-23 \
 *     --dims isoYearIsoWeek,sessionSourceMedium --metrics screenPageViews,sessions,engagedSessions \
 *     --filter 'pagePath^=/themes/local-finance' --japan
 *   node .claude/scripts/metrics/ga4-query.mjs --dims customEvent:ad_id --metrics eventCount \
 *     --filter 'eventName==affiliate_impression' --filter 'customEvent:ad_id*=13307001'
 *
 * フィルタ記法は lib/ga4-query.mjs。期間の既定は 28daysAgo..yesterday。
 * 認証: GOOGLE_SERVICE_ACCOUNT_KEY_JSON env または stats47-*.json。Property: env GA4_PROPERTY_ID (未設定時 463218070)。
 * 出力は stdout (csv / json)。先頭行に期間と総行数をコメントで出すので、そのまま根拠として引用できる。
 */
import { google } from "googleapis";
import { resolveServiceAccountKeyFile, toCsv } from "./lib/auth.mjs";
import { buildQuery } from "./lib/ga4-query.mjs";

const DEFAULT_PROPERTY_ID = "463218070";

const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];

/**
 * env の鍵は一時ファイルへ書かずメモリで渡す。CI の無人 triage (公開 repo へ push する) から呼ばれるため、
 * resolveServiceAccountKeyFile のように /tmp へ鍵を置くと、読める場所に秘密が残る。
 */
function createAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  if (json) return new google.auth.GoogleAuth({ credentials: JSON.parse(json), scopes: SCOPES });
  return new google.auth.GoogleAuth({ keyFile: resolveServiceAccountKeyFile(), scopes: SCOPES });
}

async function main() {
  const { request, format } = buildQuery(process.argv.slice(2));
  const auth = createAuth();
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });
  const property = `properties/${process.env.GA4_PROPERTY_ID || DEFAULT_PROPERTY_ID}`;
  const { data } = await analyticsdata.properties.runReport({ property, requestBody: request });
  const dims = (data.dimensionHeaders ?? []).map((h) => h.name);
  const metrics = (data.metricHeaders ?? []).map((h) => h.name);
  const rows = (data.rows ?? []).map((row) => ({
    ...Object.fromEntries((row.dimensionValues ?? []).map((v, i) => [dims[i], v.value])),
    ...Object.fromEntries((row.metricValues ?? []).map((v, i) => [metrics[i], Number(v.value)])),
  }));
  const range = request.dateRanges[0];
  if (format === "json") {
    process.stdout.write(JSON.stringify({ property, ...range, rowCount: data.rowCount ?? 0, rows }, null, 2) + "\n");
    return;
  }
  process.stdout.write(`# ${property} ${range.startDate}..${range.endDate} rowCount=${data.rowCount ?? 0} shown=${rows.length}\n`);
  process.stdout.write(toCsv(rows, [...dims, ...metrics]));
}

main().catch((error) => {
  console.error(`[ga4-query] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
