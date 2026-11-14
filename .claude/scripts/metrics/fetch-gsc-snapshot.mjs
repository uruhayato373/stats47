/**
 * GSC 週次 snapshot
 *
 * 引数:
 *   YYYY-Www (省略時は今日 JST の ISO 週。未来週は失敗する)
 *
 * 出力先: data/gsc/snapshots/<YYYY-Www>/
 *   - queries/pages/devices/countries/daily.csv … ローリング28日 (機会発見用)
 *   - queries-finalized7d.csv / pages-finalized7d.csv … 確定7日 (finalized7d) の明細。前週と重ならないので
 *     カテゴリ別の前週比に使う (lib/gsc-demand.mjs。GSC-DEMAND-REPORT-01)
 *   - summary.json … 確定7日 KPI (finalized7d/previous7d) + rolling28d の期間 metadata 付き summary。
 *     details に明細の期間とキーワード表の捕捉率 (queries の clicks 合計 ÷ サイト全体の clicks) を持つ
 * 認証: ../lib/google-client.cjs (GOOGLE_SERVICE_ACCOUNT_KEY_JSON env または stats47-*.json)
 *
 * 期間契約 (.claude/skills/analytics/search-growth/reference/weekly-cycle-contract.md):
 * - 期間は lib/periods.mjs (SSOT) が week から決定的に導出する (実行日に依存しない)。
 * - 取得遅延 3 日。欠損日は 0 補完せず summary.json の coverage に記録する。
 * - 欠損 (partial) は exit 0 で書き出し、check-period-contract.mjs が後段で赤くする
 *   (source 単位の failure isolation を保ちつつ partial を隠さない)。API 失敗は exit 1。
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  PROJECT_ROOT,
  parseWeekArg,
  toCsv,
} from "./lib/auth.mjs";
import { resolvePeriods } from "./lib/periods.mjs";
import { buildGscSummary, SUMMARY_FILE } from "./lib/weekly-summary.mjs";
import { PAGES_FINALIZED_FILE, QUERIES_FINALIZED_FILE, detailCoverage } from "./lib/gsc-demand.mjs";
import { GSC_PROPERTY } from "../lib/site-config.cjs";
import { createSearchConsoleClient } from "../lib/google-client.cjs";
import { datasetDir } from "../../../config/datasets.mjs";

const SITE_URL = GSC_PROPERTY;

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
  const searchconsole = createSearchConsoleClient();

  // 期間は week から決定的に導出 (SSOT: periods.mjs)。未来週はここで throw する。
  const periods = resolvePeriods({ source: "gsc", week });
  const { periodStart: startDate, periodEnd: endDate } = periods.rolling28d;

  const outDir = join(PROJECT_ROOT, datasetDir("gsc.snapshots"), week);
  mkdirSync(outDir, { recursive: true });

  const fin = periods.finalized7d;
  const jobs = [
    { dim: "query", file: "queries.csv", startDate, endDate },
    { dim: "page", file: "pages.csv", startDate, endDate },
    { dim: "device", file: "devices.csv", startDate, endDate },
    { dim: "country", file: "countries.csv", startDate, endDate },
    { dim: "date", file: "daily.csv", startDate, endDate },
    { dim: "query", file: QUERIES_FINALIZED_FILE, startDate: fin.periodStart, endDate: fin.periodEnd },
    { dim: "page", file: PAGES_FINALIZED_FILE, startDate: fin.periodStart, endDate: fin.periodEnd },
  ];

  const summaryLines = [];
  /** @type {Record<string, any[]>} */
  const rowsByFile = {};
  for (const job of jobs) {
    const raw = await fetchAll(searchconsole, [job.dim], job.startDate, job.endDate);
    const normalized = normalize(raw, job.dim);
    const csv = toCsv(normalized, [job.dim, "clicks", "impressions", "ctr", "position"]);
    writeFileSync(join(outDir, job.file), csv);
    summaryLines.push(`${job.file}: ${normalized.length} rows (${job.startDate}..${job.endDate})`);
    rowsByFile[job.file] = normalized;
  }

  // 確定7日 KPI summary (finalized7d/previous7d/rolling28d + 期間 metadata)
  const summary = buildGscSummary({ week, dailyRows: rowsByFile["daily.csv"] ?? [] });
  // 明細の期間と捕捉率 (キーワード表はクリックの一部しか載らない。伏せられた検索語は推定で埋めない)
  const siteClicks28d = (rowsByFile["daily.csv"] ?? []).reduce((s, r) => s + Number(r.clicks || 0), 0);
  summary.details = {
    rolling28d: detailCoverage({
      periodStart: startDate,
      periodEnd: endDate,
      queryRows: rowsByFile["queries.csv"],
      pageRows: rowsByFile["pages.csv"],
      siteClicks: siteClicks28d,
    }),
    finalized7d: detailCoverage({
      periodStart: fin.periodStart,
      periodEnd: fin.periodEnd,
      queryRows: rowsByFile[QUERIES_FINALIZED_FILE],
      pageRows: rowsByFile[PAGES_FINALIZED_FILE],
      siteClicks: summary.finalized7d.kpis.clicks,
    }),
  };
  summaryLines.push(
    `keyword capture: 28d ${summary.details.rolling28d.queryCaptureRate} / finalized7d ${summary.details.finalized7d.queryCaptureRate}`,
  );
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
