/**
 * AdSense 週次 snapshot
 *
 * 引数:
 *   YYYY-Www (省略時は今日 JST の ISO 週。未来週は失敗する)
 *   --dry-run (API を呼ばず、job 契約・期間・出力先だけを表示する)
 *
 * 出力先: .claude/skills/analytics/adsense-improvement/reference/snapshots/<YYYY-Www>/
 *   - overview/daily/devices/units/formats-platforms/placements-platforms/
 *     bid-types-platforms/traffic-sources/countries/pages.csv
 *   - manifest.json … job 別の期間 metadata・status・limitations (doc41 §4.2)
 * 認証: OAuth 2.0 (env: GOOGLE_ADSENSE_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN)
 * AdSense account: env GOOGLE_ADSENSE_ACCOUNT_ID (例 pub-7995274743017484)
 *
 * 期間契約 (doc41 §4.2 / doc39 §18.2):
 * - 期間は lib/periods.mjs (SSOT) が week から決定的に導出する。取得遅延 1 日。
 * - 公式 COST_PER_CLICK / IMPRESSIONS_RPM / AD_REQUESTS / AD_REQUESTS_COVERAGE を取得する。
 * - job ごとの失敗は隔離し manifest に status=error として記録する (全滅のみ exit 1)。
 * - PAGE_URL の 0 行は privacy-threshold (エラー・0 PV と混同しない)。
 *
 * 401 invalid_grant を検知した場合は refresh token の再発行が必要。
 */

import { google } from "googleapis";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_ROOT, parseWeekArg, toCsv } from "./lib/auth.mjs";
import { resolvePeriods, addDays, expectedDates, assessDailyCoverage } from "./lib/periods.mjs";
import {
  REPORT_JOBS,
  buildJobManifest,
  classifyJobStatus,
  currencyFromHeaders,
  MANIFEST_FILE,
} from "./lib/adsense-report-contract.mjs";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`ENV ${name} is required for AdSense fetch`);
    process.exit(2);
  }
  return v;
}

/** "YYYY-MM-DD" → {year,month,day} (AdSense v2 の date parts)。 */
function dateParts(label) {
  const [y, m, d] = label.split("-").map(Number);
  return { year: y, month: m, day: d };
}

async function fetchReport(adsense, account, job, periodStart, periodEnd) {
  const s = dateParts(periodStart);
  const e = dateParts(periodEnd);
  const res = await adsense.accounts.reports.generate({
    account,
    dateRange: "CUSTOM",
    "startDate.year": s.year,
    "startDate.month": s.month,
    "startDate.day": s.day,
    "endDate.year": e.year,
    "endDate.month": e.month,
    "endDate.day": e.day,
    dimensions: [...job.dimensions],
    metrics: [...job.metrics],
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

/** job の取得期間を決定する (finalized7d 既定・pages は同じ後端の 30 日窓)。 */
function jobPeriod(job, periods) {
  if (job.periodKind === "rolling30d" || job.windowDays === 30) {
    const periodEnd = periods.finalized7d.periodEnd;
    return { periodStart: addDays(periodEnd, -29), periodEnd, windowDays: 30 };
  }
  return periods.finalized7d;
}

async function main() {
  const week = parseWeekArg();
  const dryRun = process.argv.includes("--dry-run");

  // 期間は week から決定的に導出 (SSOT: periods.mjs)。未来週はここで throw する。
  const periods = resolvePeriods({ source: "adsense", week });
  const outDir = join(PROJECT_ROOT, ".claude/skills/analytics/adsense-improvement/reference/snapshots", week);

  if (dryRun) {
    console.log(`[adsense-snapshot] DRY-RUN week=${week} anchor=${periods.anchor} (遅延 ${periods.delayDays} 日)`);
    console.log(`finalized7d: ${periods.finalized7d.periodStart} ~ ${periods.finalized7d.periodEnd}`);
    for (const job of REPORT_JOBS) {
      const p = jobPeriod(job, periods);
      console.log(
        `  ${job.name.padEnd(22)} ${p.periodStart}..${p.periodEnd} dims=[${job.dimensions.join(",")}] metrics=${job.metrics.length}`,
      );
    }
    console.log(`out: ${outDir} (+ ${MANIFEST_FILE})`);
    return;
  }

  const clientId = requireEnv("GOOGLE_ADSENSE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_ADSENSE_CLIENT_SECRET");
  const refreshToken = requireEnv("GOOGLE_ADSENSE_REFRESH_TOKEN");
  const accountId = requireEnv("GOOGLE_ADSENSE_ACCOUNT_ID");

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const adsense = google.adsense({ version: "v2", auth: oauth2Client });
  const account = `accounts/${accountId}`;

  mkdirSync(outDir, { recursive: true });

  const generatedAt = new Date().toISOString();
  const manifest = { schemaVersion: 2, week, anchor: periods.anchor, generatedAt, jobs: {} };
  const summary = [];
  let okCount = 0;
  let invalidGrant = false;

  for (const job of REPORT_JOBS) {
    const period = jobPeriod(job, periods);
    let rows = [];
    let error = null;
    let currencyCode = null;
    let missingDates = [];
    try {
      const report = await fetchReport(adsense, account, job, period.periodStart, period.periodEnd);
      rows = flatten(report);
      currencyCode = currencyFromHeaders(report.headers);
      if (job.dimensions.includes("DATE")) {
        // 日別 job は欠損日を検出する (0 補完しない・doc39 §18.2)
        const present = rows.map((r) => String(r.DATE ?? "").replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3"));
        const cov = assessDailyCoverage(period, present);
        missingDates = cov.missingDates;
      }
      const headers = [...job.dimensions, ...job.metrics];
      writeFileSync(join(outDir, job.file), toCsv(rows, headers));
      okCount++;
    } catch (e) {
      error = e.message || String(e);
      if (error.includes("invalid_grant") || e.response?.data?.error === "invalid_grant") invalidGrant = true;
      console.error(`[adsense-snapshot] ${job.name} failed:`, error);
    }
    const status = classifyJobStatus(job, rows.length, { error, missingDates });
    manifest.jobs[job.name] = buildJobManifest({
      job,
      period,
      rowCount: rows.length,
      status,
      generatedAt,
      currencyCode,
      timeZone: null, // v2 report response は timeZone を返さない — unknown として記録
      limitations: missingDates.length ? [`欠損日: ${missingDates.join(",")}`] : [],
      error,
    });
    summary.push(`${job.file}: ${rows.length} rows (${status})`);
  }

  writeFileSync(join(outDir, MANIFEST_FILE), JSON.stringify(manifest, null, 2) + "\n");

  if (invalidGrant) {
    console.error(
      "\n❌ AdSense OAuth refresh token が無効です。\n" +
        "GOOGLE_ADSENSE_REFRESH_TOKEN を再発行して GitHub Secret を更新してください。\n" +
        "取得手順: .claude/skills/analytics/fetch-adsense-data/SKILL.md 参照\n",
    );
  }

  console.log(`[adsense-snapshot] ${week} saved to ${outDir}`);
  console.log(`finalized7d: ${periods.finalized7d.periodStart} ~ ${periods.finalized7d.periodEnd} (遅延 ${periods.delayDays} 日・anchor=${periods.anchor})`);
  console.log(summary.join("\n"));
  // 全 job 失敗のみ exit 1 (job 単位の失敗は manifest の status=error が保持する)
  if (okCount === 0) process.exit(1);
}

main().catch((e) => {
  console.error("AdSense snapshot failed:", e.message || e);
  if (e.errors) console.error(e.errors);
  process.exit(1);
});
