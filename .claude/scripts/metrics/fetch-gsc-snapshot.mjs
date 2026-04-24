/**
 * GSC 週次 snapshot
 *
 * 引数:
 *   --week YYYY-Www (省略時は今日の ISO 週)
 *
 * 出力先: .claude/skills/analytics/gsc-improvement/reference/snapshots/<YYYY-Www>/
 * 認証: GOOGLE_SERVICE_ACCOUNT_KEY_JSON env または stats47-*.json
 *
 * 既存の fetch-gsc-data SKILL.md の snapshot モードロジックを移植したもの。
 * CI でも Local でも動くように .env.local dependency を排除。
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

const SITE_URL = "sc-domain:stats47.jp";
const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

async function fetchAll(searchconsole, dimensions, startDate, endDate) {
  const rows = [];
  let startRow = 0;
  const rowLimit = 25000;
  while (true) {
    const res = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: fmtDate(startDate),
        endDate: fmtDate(endDate),
        dimensions,
        rowLimit,
        startRow,
      },
    });
    const batch = res.data.rows || [];
    rows.push(...batch);
    if (batch.length < rowLimit) break;
    startRow += rowLimit;
  }
  return rows;
}

function normalize(rows, dimName) {
  return rows.map((r) => ({
    [dimName]: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr.toFixed(4),
    position: r.position.toFixed(2),
  }));
}

async function main() {
  const week = parseWeekArg();
  const keyFile = resolveServiceAccountKeyFile();

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 2); // GSC は 2 日遅延
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 27);

  const outDir = join(PROJECT_ROOT, ".claude/skills/analytics/gsc-improvement/reference/snapshots", week);
  mkdirSync(outDir, { recursive: true });

  const auth = new google.auth.GoogleAuth({ keyFile, scopes: SCOPES });
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const jobs = [
    { dim: "query", file: "queries.csv" },
    { dim: "page", file: "pages.csv" },
    { dim: "device", file: "devices.csv" },
    { dim: "country", file: "countries.csv" },
    { dim: "date", file: "daily.csv" },
  ];

  const summary = [];
  for (const job of jobs) {
    const raw = await fetchAll(searchconsole, [job.dim], startDate, endDate);
    const normalized = normalize(raw, job.dim);
    const csv = toCsv(normalized, [job.dim, "clicks", "impressions", "ctr", "position"]);
    writeFileSync(join(outDir, job.file), csv);
    summary.push(`${job.file}: ${normalized.length} rows`);
  }

  console.log(`[gsc-snapshot] ${week} saved to ${outDir}`);
  console.log(`period: ${fmtDate(startDate)} ~ ${fmtDate(endDate)}`);
  console.log(summary.join("\n"));
}

main().catch((e) => {
  console.error("GSC snapshot failed:", e.message || e);
  if (e.errors) console.error(e.errors);
  process.exit(1);
});
