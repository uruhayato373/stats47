/**
 * GSC 週次 snapshot
 *
 * 引数:
 *   YYYY-Www (省略時は今日 JST の ISO 週。未来週は失敗する)
 *
 * 出力先: .claude/skills/analytics/gsc-improvement/reference/snapshots/<YYYY-Www>/
 *   - queries/pages/devices/countries/daily.csv … ローリング28日 (機会発見用・§18.2)
 *   - summary.json … 確定7日 KPI (finalized7d/previous7d) + rolling28d の期間 metadata 付き summary
 * 認証: GOOGLE_SERVICE_ACCOUNT_KEY_JSON env または stats47-*.json
 *
 * 期間契約 (docs/02_実装計画/39 §18.2):
 * - 期間は lib/periods.mjs (SSOT) が week から決定的に導出する (実行日に依存しない)。
 * - 取得遅延 3 日。欠損日は 0 補完せず summary.json の coverage に記録する。
 * - 欠損 (partial) は exit 0 で書き出し、check-period-contract.mjs が後段で赤くする
 *   (source 単位の failure isolation を保ちつつ partial を隠さない)。API 失敗は exit 1。
 */

import { google } from "googleapis";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  PROJECT_ROOT,
  resolveServiceAccountKeyFile,
  parseWeekArg,
  toCsv,
} from "./lib/auth.mjs";
import { resolvePeriods } from "./lib/periods.mjs";
import { buildGscSummary, SUMMARY_FILE } from "./lib/weekly-summary.mjs";

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
        startDate,
        endDate,
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

  // 期間は week から決定的に導出 (SSOT: periods.mjs)。未来週はここで throw する。
  const periods = resolvePeriods({ source: "gsc", week });
  const { periodStart: startDate, periodEnd: endDate } = periods.rolling28d;

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

  const summaryLines = [];
  let dailyRows = null;
  for (const job of jobs) {
    const raw = await fetchAll(searchconsole, [job.dim], startDate, endDate);
    const normalized = normalize(raw, job.dim);
    const csv = toCsv(normalized, [job.dim, "clicks", "impressions", "ctr", "position"]);
    writeFileSync(join(outDir, job.file), csv);
    summaryLines.push(`${job.file}: ${normalized.length} rows`);
    if (job.dim === "date") dailyRows = normalized;
  }

  // 確定7日 KPI summary (finalized7d/previous7d/rolling28d + 期間 metadata・§18.2)
  const summary = buildGscSummary({ week, dailyRows: dailyRows ?? [] });
  writeFileSync(join(outDir, SUMMARY_FILE), JSON.stringify(summary, null, 2) + "\n");
  summaryLines.push(
    `${SUMMARY_FILE}: finalized7d ${summary.finalized7d.periodStart}..${summary.finalized7d.periodEnd} ` +
      `coverage=${summary.finalized7d.coverage.status}`,
  );

  console.log(`[gsc-snapshot] ${week} saved to ${outDir}`);
  console.log(`rolling28d: ${startDate} ~ ${endDate} (取得遅延 ${periods.delayDays} 日・anchor=${periods.anchor})`);
  console.log(summaryLines.join("\n"));
  if (summary.wowBlockedReason) {
    console.warn(`[gsc-snapshot] ⚠ ${summary.wowBlockedReason}`);
    console.warn("[gsc-snapshot] KPI/WoW/ゲート判定は停止する (check-period-contract が検出する)");
  }
}

main().catch((e) => {
  console.error("GSC snapshot failed:", e.message || e);
  if (e.errors) console.error(e.errors);
  process.exit(1);
});
