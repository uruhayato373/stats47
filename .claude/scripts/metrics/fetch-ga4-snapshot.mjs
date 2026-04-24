/**
 * GA4 週次 snapshot
 *
 * 引数:
 *   --week YYYY-Www (省略時は今日の ISO 週)
 *
 * 出力先: .claude/skills/analytics/ga4-improvement/reference/snapshots/<YYYY-Www>/
 * 認証: GOOGLE_SERVICE_ACCOUNT_KEY_JSON env または stats47-*.json
 * GA4 Property: env GA4_PROPERTY_ID（未設定時は 463218070）
 */

import { google } from "googleapis";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  PROJECT_ROOT,
  resolveServiceAccountKeyFile,
  parseWeekArg,
  toCsv,
  fmtDate,
} from "./lib/auth.mjs";

const DEFAULT_PROPERTY_ID = "463218070";
const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];

function toRow(row, dimNames, metricNames) {
  const r = {};
  dimNames.forEach((n, i) => {
    r[n] = row.dimensionValues?.[i]?.value ?? "";
  });
  metricNames.forEach((n, i) => {
    r[n] = row.metricValues?.[i]?.value ?? "";
  });
  return r;
}

async function runReport(analyticsdata, property, requestBody) {
  const res = await analyticsdata.properties.runReport({ property, requestBody });
  return res.data.rows || [];
}

async function runReportPaged(analyticsdata, property, requestBody) {
  const rows = [];
  const limit = 10000;
  let offset = 0;
  while (true) {
    const res = await analyticsdata.properties.runReport({
      property,
      requestBody: { ...requestBody, limit, offset },
    });
    const batch = res.data.rows || [];
    rows.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return rows;
}

async function main() {
  const week = parseWeekArg();
  const keyFile = resolveServiceAccountKeyFile();
  const propertyId = process.env.GA4_PROPERTY_ID || DEFAULT_PROPERTY_ID;
  const property = `properties/${propertyId}`;

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 1); // GA4 は 1 日遅延
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 27);
  const dateRanges = [{ startDate: fmtDate(startDate), endDate: fmtDate(endDate) }];

  const outDir = join(PROJECT_ROOT, ".claude/skills/analytics/ga4-improvement/reference/snapshots", week);
  mkdirSync(outDir, { recursive: true });

  const auth = new google.auth.GoogleAuth({ keyFile, scopes: SCOPES });
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const summary = [];

  // overview
  {
    const metrics = ["activeUsers", "sessions", "screenPageViews", "averageSessionDuration", "bounceRate", "newUsers"];
    const raw = await runReport(analyticsdata, property, {
      dateRanges,
      metrics: metrics.map((n) => ({ name: n })),
    });
    const rows = raw.map((r) => toRow(r, [], metrics));
    writeFileSync(join(outDir, "overview.csv"), toCsv(rows, metrics));
    summary.push(`overview.csv: ${rows.length} rows`);
  }

  // pages
  {
    const dims = ["pagePath"];
    const metrics = ["screenPageViews", "activeUsers", "averageSessionDuration", "engagementRate"];
    const raw = await runReportPaged(analyticsdata, property, {
      dateRanges,
      dimensions: dims.map((n) => ({ name: n })),
      metrics: metrics.map((n) => ({ name: n })),
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    });
    const rows = raw.map((r) => toRow(r, dims, metrics));
    writeFileSync(join(outDir, "pages.csv"), toCsv(rows, [...dims, ...metrics]));
    summary.push(`pages.csv: ${rows.length} rows`);
  }

  // channels
  {
    const dims = ["sessionDefaultChannelGroup"];
    const metrics = ["sessions", "activeUsers", "screenPageViews", "bounceRate"];
    const raw = await runReport(analyticsdata, property, {
      dateRanges,
      dimensions: dims.map((n) => ({ name: n })),
      metrics: metrics.map((n) => ({ name: n })),
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });
    const rows = raw.map((r) => toRow(r, dims, metrics));
    writeFileSync(join(outDir, "channels.csv"), toCsv(rows, [...dims, ...metrics]));
    summary.push(`channels.csv: ${rows.length} rows`);
  }

  // devices
  {
    const dims = ["deviceCategory"];
    const metrics = ["sessions", "activeUsers", "screenPageViews", "averageSessionDuration"];
    const raw = await runReport(analyticsdata, property, {
      dateRanges,
      dimensions: dims.map((n) => ({ name: n })),
      metrics: metrics.map((n) => ({ name: n })),
    });
    const rows = raw.map((r) => toRow(r, dims, metrics));
    writeFileSync(join(outDir, "devices.csv"), toCsv(rows, [...dims, ...metrics]));
    summary.push(`devices.csv: ${rows.length} rows`);
  }

  // daily
  {
    const dims = ["date"];
    const metrics = ["activeUsers", "sessions", "screenPageViews", "newUsers"];
    const raw = await runReport(analyticsdata, property, {
      dateRanges,
      dimensions: dims.map((n) => ({ name: n })),
      metrics: metrics.map((n) => ({ name: n })),
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });
    const rows = raw.map((r) => toRow(r, dims, metrics));
    writeFileSync(join(outDir, "daily.csv"), toCsv(rows, [...dims, ...metrics]));
    summary.push(`daily.csv: ${rows.length} rows`);
  }

  console.log(`[ga4-snapshot] ${week} saved to ${outDir}`);
  console.log(`period: ${fmtDate(startDate)} ~ ${fmtDate(endDate)}`);
  console.log(summary.join("\n"));
}

main().catch((e) => {
  console.error("GA4 snapshot failed:", e.message || e);
  if (e.errors) console.error(e.errors);
  process.exit(1);
});
