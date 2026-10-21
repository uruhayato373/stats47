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
 * 認証: ../lib/google-client.cjs (GOOGLE_SERVICE_ACCOUNT_KEY_JSON env または stats47-*.json)。Property: env GA4_PROPERTY_ID (未設定時 463218070)。
 * 出力は stdout (csv / json)。先頭行に期間と総行数をコメントで出すので、そのまま根拠として引用できる。
 */
import { toCsv } from "./lib/auth.mjs";
import { buildQuery } from "./lib/ga4-query.mjs";
import { GA4_PROPERTY_ID } from "../lib/site-config.cjs";
import { createGa4DataClient } from "../lib/google-client.cjs";

const DEFAULT_PROPERTY_ID = GA4_PROPERTY_ID;

async function main() {
  const { request, format } = buildQuery(process.argv.slice(2));
  const analyticsdata = createGa4DataClient();
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
