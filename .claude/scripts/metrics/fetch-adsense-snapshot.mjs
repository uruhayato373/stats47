/**
 * AdSense 週次 snapshot
 *
 * 引数:
 *   --week YYYY-Www (省略時は今日の ISO 週)
 *
 * 出力先: .claude/skills/analytics/adsense-improvement/reference/snapshots/<YYYY-Www>/
 * 認証: OAuth 2.0 (env: GOOGLE_ADSENSE_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN)
 * AdSense account: env GOOGLE_ADSENSE_ACCOUNT_ID (例 pub-7995274743017484)
 *
 * 期間: last7d（AdSense は 1 日遅延、8 日前〜1 日前）
 *
 * 401 invalid_grant を検知した場合は refresh token の再発行が必要。
 */

import { google } from "googleapis";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_ROOT, parseWeekArg, toCsv, fmtDate } from "./lib/auth.mjs";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`ENV ${name} is required for AdSense fetch`);
    process.exit(2);
  }
  return v;
}

async function fetchReport(adsense, account, dims, metrics, startDate, endDate) {
  const res = await adsense.accounts.reports.generate({
    account,
    dateRange: "CUSTOM",
    "startDate.year": startDate.getFullYear(),
    "startDate.month": startDate.getMonth() + 1,
    "startDate.day": startDate.getDate(),
    "endDate.year": endDate.getFullYear(),
    "endDate.month": endDate.getMonth() + 1,
    "endDate.day": endDate.getDate(),
    dimensions: dims,
    metrics,
    limit: 1000,
  });
  return res.data;
}

function flatten(report) {
  const headers = report.headers?.map((h) => h.name) || [];
  return (report.rows || []).map((row) => {
    const out = {};
    row.cells.forEach((cell, i) => {
      out[headers[i]] = cell.value;
    });
    return out;
  });
}

async function main() {
  const week = parseWeekArg();
  const clientId = requireEnv("GOOGLE_ADSENSE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_ADSENSE_CLIENT_SECRET");
  const refreshToken = requireEnv("GOOGLE_ADSENSE_REFRESH_TOKEN");
  const accountId = requireEnv("GOOGLE_ADSENSE_ACCOUNT_ID");

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const adsense = google.adsense({ version: "v2", auth: oauth2Client });
  const account = `accounts/${accountId}`;

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 1);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 6);

  const outDir = join(PROJECT_ROOT, ".claude/skills/analytics/adsense-improvement/reference/snapshots", week);
  mkdirSync(outDir, { recursive: true });

  const METRICS = [
    "ESTIMATED_EARNINGS",
    "PAGE_VIEWS",
    "PAGE_VIEWS_RPM",
    "IMPRESSIONS",
    "CLICKS",
    "IMPRESSIONS_CTR",
    "ACTIVE_VIEW_VIEWABILITY",
  ];

  const jobs = [
    { name: "overview", dims: [], file: "overview.csv" },
    { name: "pages", dims: ["PAGE_URL"], file: "pages.csv" },
    { name: "units", dims: ["AD_UNIT_NAME"], file: "units.csv" },
    { name: "devices", dims: ["PLATFORM_TYPE_NAME"], file: "devices.csv" },
    { name: "daily", dims: ["DATE"], file: "daily.csv" },
  ];

  const summary = [];
  try {
    for (const job of jobs) {
      const report = await fetchReport(adsense, account, job.dims, METRICS, startDate, endDate);
      const rows = flatten(report);
      const headers = [...job.dims, ...METRICS];
      writeFileSync(join(outDir, job.file), toCsv(rows, headers));
      summary.push(`${job.file}: ${rows.length} rows`);
    }
  } catch (e) {
    if (e.message?.includes("invalid_grant") || e.response?.data?.error === "invalid_grant") {
      console.error(
        "\n❌ AdSense OAuth refresh token が無効です。\n" +
          "GOOGLE_ADSENSE_REFRESH_TOKEN を再発行して GitHub Secret を更新してください。\n" +
          "取得手順: .claude/skills/analytics/fetch-adsense-data/SKILL.md 参照\n"
      );
    }
    throw e;
  }

  console.log(`[adsense-snapshot] ${week} saved to ${outDir}`);
  console.log(`period: ${fmtDate(startDate)} ~ ${fmtDate(endDate)}`);
  console.log(summary.join("\n"));
}

main().catch((e) => {
  console.error("AdSense snapshot failed:", e.message || e);
  if (e.errors) console.error(e.errors);
  process.exit(1);
});
