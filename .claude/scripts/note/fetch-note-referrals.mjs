#!/usr/bin/env node

/**
 * GA4 の note.com 参照流入を、素URLカードと両立する着地ページ単位で保存する。
 * Usage: node .claude/scripts/note/fetch-note-referrals.mjs [--start YYYY-MM-DD] [--end YYYY-MM-DD]
 */
import { google } from "googleapis";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { PROJECT_ROOT, resolveServiceAccountKeyFile } from "../metrics/lib/auth.mjs";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "463218070";
const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function isoInJst(offsetDays = 0) {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  now.setUTCDate(now.getUTCDate() + offsetDays);
  return now.toISOString().slice(0, 10);
}

const endDate = option("--end") || isoInJst(-1);
const startDate = option("--start") || (() => {
  const date = new Date(`${endDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 27);
  return date.toISOString().slice(0, 10);
})();
for (const [label, value] of [["start", startDate], ["end", endDate]]) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} が YYYY-MM-DD ではありません: ${value}`);
}
if (startDate > endDate) throw new Error(`期間が逆転しています: ${startDate} > ${endDate}`);

const SOURCE_FILTER = {
  filter: {
    fieldName: "sessionSource",
    stringFilter: { matchType: "EXACT", value: "note.com" },
  },
};
const JAPAN_FILTER = {
  filter: {
    fieldName: "country",
    stringFilter: { matchType: "EXACT", value: "Japan" },
  },
};
const METRICS = ["sessions", "activeUsers", "engagedSessions", "screenPageViews"];

function rowsToReport(rows = []) {
  const landings = rows.map((row) => ({
    landingPagePlusQueryString: row.dimensionValues?.[0]?.value || "",
    sessions: Number(row.metricValues?.[0]?.value || 0),
    activeUsers: Number(row.metricValues?.[1]?.value || 0),
    engagedSessions: Number(row.metricValues?.[2]?.value || 0),
    screenPageViews: Number(row.metricValues?.[3]?.value || 0),
  }));
  const summary = landings.reduce(
    (total, row) => ({
      sessions: total.sessions + row.sessions,
      activeUsers: total.activeUsers + row.activeUsers,
      engagedSessions: total.engagedSessions + row.engagedSessions,
      screenPageViews: total.screenPageViews + row.screenPageViews,
    }),
    { sessions: 0, activeUsers: 0, engagedSessions: 0, screenPageViews: 0 },
  );
  return { summary, landings };
}

async function run(analytics, countryJapanOnly) {
  const expressions = countryJapanOnly ? [SOURCE_FILTER, JAPAN_FILTER] : [SOURCE_FILTER];
  const response = await analytics.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "landingPagePlusQueryString" }],
      metrics: METRICS.map((name) => ({ name })),
      dimensionFilter: expressions.length === 1 ? expressions[0] : { andGroup: { expressions } },
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10_000,
    },
  });
  return rowsToReport(response.data.rows);
}

const auth = new google.auth.GoogleAuth({
  keyFile: resolveServiceAccountKeyFile(),
  scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
});
const analytics = google.analyticsdata({ version: "v1beta", auth });
const [raw, japan] = await Promise.all([run(analytics, false), run(analytics, true)]);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  period: { startDate, endDate, inclusiveDays: 28 },
  account: "stats47",
  attribution: {
    source: "GA4 sessionSource=note.com",
    dimension: "landingPagePlusQueryString",
    cardUrlPolicy: "query-free HTTPS URL; no UTM",
  },
  raw,
  japan,
};
const output = join(PROJECT_ROOT, ".claude/state/metrics", `note-referrals-${isoInJst()}.json`);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(`${output}.tmp`, `${JSON.stringify(report, null, 2)}\n`, "utf8");
renameSync(`${output}.tmp`, output);
console.log(JSON.stringify({ output, period: report.period, raw: raw.summary, japan: japan.summary }, null, 2));
