/**
 * GA4 週次 snapshot
 *
 * 引数:
 *   YYYY-Www (省略時は今日 JST の ISO 週。未来週は失敗する)
 *
 * 出力先: .claude/skills/analytics/ga4-improvement/reference/snapshots/<YYYY-Www>/
 *   - overview/pages/channels/devices/daily.csv … raw ローリング28日 (機会発見 + pollution 監視用)
 *   - survey-navigation.csv … Japan-only の survey→ranking nav_click (ローリング28日)
 *   - overview-clean.csv … Japan-only カレンダー週 (GA4-PIPELINE-02 後方互換系列・history.csv 用)
 *   - daily-clean.csv … Japan-only 日別 14 日 (確定7日 KPI の coverage 判定用)
 *   - summary.json … jpFinalized7d/jpPrevious7d KPI + raw pollution (期間 metadata 付き)
 * 認証: GOOGLE_SERVICE_ACCOUNT_KEY_JSON env または stats47-*.json
 * GA4 Property: env GA4_PROPERTY_ID（未設定時は 463218070）
 *
 * 期間契約 (.claude/skills/analytics/search-growth/reference/weekly-cycle-contract.md):
 * - 期間は lib/periods.mjs (SSOT) が week から決定的に導出する。取得遅延 1 日。
 * - KPI は country=Japan の clean slice。raw は pollution 監視専用で KPI へ混ぜない。
 * - 一部 report の失敗は summary.json / limitations に記録して exit 0
 *   (check-period-contract.mjs が後段で検出する)。全滅は exit 1。
 */

import { google } from "googleapis";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  PROJECT_ROOT,
  resolveServiceAccountKeyFile,
  parseWeekArg,
  isoWeekToDateRange,
  toCsv,
} from "./lib/auth.mjs";
import { resolvePeriods } from "./lib/periods.mjs";
import { buildGa4Summary, SUMMARY_FILE } from "./lib/weekly-summary.mjs";

const DEFAULT_PROPERTY_ID = "463218070";
const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];

const JAPAN_FILTER = {
  filter: {
    fieldName: "country",
    stringFilter: { matchType: "EXACT", value: "Japan" },
  },
};

const SURVEY_RANKING_NAV_FILTER = {
  andGroup: {
    expressions: [
      JAPAN_FILTER,
      {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: "nav_click" },
        },
      },
      {
        filter: {
          fieldName: "customEvent:nav_surface",
          stringFilter: { matchType: "EXACT", value: "survey_ranking" },
        },
      },
    ],
  },
};

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

/** GA4 date dimension ("20260719") → "2026-07-19" */
function ga4DateToIso(v) {
  const s = String(v);
  return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s;
}

async function main() {
  const week = parseWeekArg();
  const keyFile = resolveServiceAccountKeyFile();
  const propertyId = process.env.GA4_PROPERTY_ID || DEFAULT_PROPERTY_ID;
  const property = `properties/${propertyId}`;

  // 期間は week から決定的に導出 (SSOT: periods.mjs)。未来週はここで throw する。
  const periods = resolvePeriods({ source: "ga4", week });
  const rollingRange = [{ startDate: periods.rolling28d.periodStart, endDate: periods.rolling28d.periodEnd }];

  const outDir = join(PROJECT_ROOT, ".claude/skills/analytics/ga4-improvement/reference/snapshots", week);
  mkdirSync(outDir, { recursive: true });

  const auth = new google.auth.GoogleAuth({ keyFile, scopes: SCOPES });
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const summaryLines = [];
  const errors = [];

  // ── raw ローリング28日 (機会発見 + pollution 監視) ──

  // overview (raw)
  try {
    const metrics = ["activeUsers", "sessions", "screenPageViews", "averageSessionDuration", "bounceRate", "newUsers"];
    const raw = await runReport(analyticsdata, property, {
      dateRanges: rollingRange,
      metrics: metrics.map((n) => ({ name: n })),
    });
    const rows = raw.map((r) => toRow(r, [], metrics));
    writeFileSync(join(outDir, "overview.csv"), toCsv(rows, metrics));
    summaryLines.push(`overview.csv: ${rows.length} rows`);
  } catch (e) {
    errors.push(`overview: ${e.message}`);
    console.error("[ga4-snapshot] overview failed:", e.message);
  }

  // overview-clean: Japan-only, calendar week (GA4-PIPELINE-02 後方互換系列)
  try {
    const { startDate: weekStart, endDate: weekEnd } = isoWeekToDateRange(week);
    const metrics = ["activeUsers", "sessions", "engagedSessions", "screenPageViews", "averageSessionDuration", "bounceRate", "engagementRate"];
    const raw = await runReport(analyticsdata, property, {
      dateRanges: [{ startDate: weekStart, endDate: weekEnd }],
      metrics: metrics.map((n) => ({ name: n })),
      dimensionFilter: JAPAN_FILTER,
    });
    const rows = raw.map((r) => toRow(r, [], metrics));
    writeFileSync(join(outDir, "overview-clean.csv"), toCsv(rows, metrics));
    summaryLines.push(`overview-clean.csv: ${rows.length} rows (カレンダー週・末日は未確定のことがある)`);
  } catch (e) {
    errors.push(`overview-clean: ${e.message}`);
    console.error("[ga4-snapshot] overview-clean failed:", e.message);
  }

  // pages (raw)
  try {
    const dims = ["pagePath"];
    const metrics = ["screenPageViews", "activeUsers", "averageSessionDuration", "engagementRate"];
    const raw = await runReportPaged(analyticsdata, property, {
      dateRanges: rollingRange,
      dimensions: dims.map((n) => ({ name: n })),
      metrics: metrics.map((n) => ({ name: n })),
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    });
    const rows = raw.map((r) => toRow(r, dims, metrics));
    writeFileSync(join(outDir, "pages.csv"), toCsv(rows, [...dims, ...metrics]));
    summaryLines.push(`pages.csv: ${rows.length} rows`);
  } catch (e) {
    errors.push(`pages: ${e.message}`);
    console.error("[ga4-snapshot] pages failed:", e.message);
  }

  // survey-navigation: 調査ハブ → ranking の内部遷移 (Japan-only)
  // nav_surface / nav_label は既存の event-scoped custom dimensions (2026-07-20 登録済み)。
  try {
    const apiDims = ["pagePath", "customEvent:nav_surface", "customEvent:nav_label"];
    const metrics = ["eventCount"];
    const raw = await runReportPaged(analyticsdata, property, {
      dateRanges: rollingRange,
      dimensions: apiDims.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      dimensionFilter: SURVEY_RANKING_NAV_FILTER,
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    });
    const rows = raw.map((row) => {
      const value = toRow(row, apiDims, metrics);
      return {
        pagePath: value.pagePath,
        nav_surface: value["customEvent:nav_surface"],
        nav_label: value["customEvent:nav_label"],
        eventCount: value.eventCount,
      };
    });
    writeFileSync(
      join(outDir, "survey-navigation.csv"),
      toCsv(rows, ["pagePath", "nav_surface", "nav_label", "eventCount"]),
    );
    summaryLines.push(`survey-navigation.csv: ${rows.length} rows (Japan-only)`);
  } catch (e) {
    errors.push(`survey-navigation: ${e.message}`);
    console.error("[ga4-snapshot] survey-navigation failed:", e.message);
  }

  // channels (raw)
  try {
    const dims = ["sessionDefaultChannelGroup"];
    const metrics = ["sessions", "activeUsers", "screenPageViews", "bounceRate"];
    const raw = await runReport(analyticsdata, property, {
      dateRanges: rollingRange,
      dimensions: dims.map((n) => ({ name: n })),
      metrics: metrics.map((n) => ({ name: n })),
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });
    const rows = raw.map((r) => toRow(r, dims, metrics));
    writeFileSync(join(outDir, "channels.csv"), toCsv(rows, [...dims, ...metrics]));
    summaryLines.push(`channels.csv: ${rows.length} rows`);
  } catch (e) {
    errors.push(`channels: ${e.message}`);
    console.error("[ga4-snapshot] channels failed:", e.message);
  }

  // devices (raw)
  try {
    const dims = ["deviceCategory"];
    const metrics = ["sessions", "activeUsers", "screenPageViews", "averageSessionDuration"];
    const raw = await runReport(analyticsdata, property, {
      dateRanges: rollingRange,
      dimensions: dims.map((n) => ({ name: n })),
      metrics: metrics.map((n) => ({ name: n })),
    });
    const rows = raw.map((r) => toRow(r, dims, metrics));
    writeFileSync(join(outDir, "devices.csv"), toCsv(rows, [...dims, ...metrics]));
    summaryLines.push(`devices.csv: ${rows.length} rows`);
  } catch (e) {
    errors.push(`devices: ${e.message}`);
    console.error("[ga4-snapshot] devices failed:", e.message);
  }

  // daily (raw)
  try {
    const dims = ["date"];
    const metrics = ["activeUsers", "sessions", "screenPageViews", "newUsers"];
    const raw = await runReport(analyticsdata, property, {
      dateRanges: rollingRange,
      dimensions: dims.map((n) => ({ name: n })),
      metrics: metrics.map((n) => ({ name: n })),
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });
    const rows = raw.map((r) => toRow(r, dims, metrics));
    writeFileSync(join(outDir, "daily.csv"), toCsv(rows, [...dims, ...metrics]));
    summaryLines.push(`daily.csv: ${rows.length} rows`);
  } catch (e) {
    errors.push(`daily: ${e.message}`);
    console.error("[ga4-snapshot] daily failed:", e.message);
  }

  // ── 確定7日 KPI (Japan-only clean) ──

  const kpiMetrics = ["activeUsers", "sessions", "engagedSessions", "screenPageViews", "engagementRate"];
  const totalsFor = async (period, dimensionFilter) => {
    const raw = await runReport(analyticsdata, property, {
      dateRanges: [{ startDate: period.periodStart, endDate: period.periodEnd }],
      metrics: kpiMetrics.map((n) => ({ name: n })),
      ...(dimensionFilter ? { dimensionFilter } : {}),
    });
    return raw.length ? toRow(raw[0], [], kpiMetrics) : null;
  };

  let finalizedTotals = null;
  let previousTotals = null;
  let rawFinalizedTotals = null;
  let dailyCleanRows = [];
  try {
    finalizedTotals = await totalsFor(periods.finalized7d, JAPAN_FILTER);
    previousTotals = await totalsFor(periods.previous7d, JAPAN_FILTER);
    rawFinalizedTotals = await totalsFor(periods.finalized7d, null);

    // Japan-only 日別 (previous7d 開始〜finalized7d 終了の 14 日) — coverage 判定用
    const dims = ["date"];
    const dailyRaw = await runReport(analyticsdata, property, {
      dateRanges: [{ startDate: periods.previous7d.periodStart, endDate: periods.finalized7d.periodEnd }],
      dimensions: dims.map((n) => ({ name: n })),
      metrics: kpiMetrics.map((n) => ({ name: n })),
      dimensionFilter: JAPAN_FILTER,
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });
    dailyCleanRows = dailyRaw.map((r) => {
      const row = toRow(r, dims, kpiMetrics);
      return { ...row, date: ga4DateToIso(row.date) };
    });
    writeFileSync(join(outDir, "daily-clean.csv"), toCsv(dailyCleanRows, ["date", ...kpiMetrics]));
    summaryLines.push(`daily-clean.csv: ${dailyCleanRows.length} rows (Japan-only)`);
  } catch (e) {
    errors.push(`jp-finalized7d: ${e.message}`);
    console.error("[ga4-snapshot] jp-finalized7d failed:", e.message);
  }

  const summary = buildGa4Summary({
    week,
    finalizedTotals,
    previousTotals,
    dailyCleanRows,
    rawFinalizedTotals,
  });
  if (errors.length > 0) {
    summary.jpFinalized7d.limitations.push(`一部 report 失敗: ${errors.join(" / ")}`);
  }
  writeFileSync(join(outDir, SUMMARY_FILE), JSON.stringify(summary, null, 2) + "\n");
  summaryLines.push(
    `${SUMMARY_FILE}: jpFinalized7d ${summary.jpFinalized7d.periodStart}..${summary.jpFinalized7d.periodEnd} ` +
      `coverage=${summary.jpFinalized7d.coverage.status}`,
  );

  console.log(`[ga4-snapshot] ${week} saved to ${outDir}`);
  console.log(
    `rolling28d(raw): ${periods.rolling28d.periodStart} ~ ${periods.rolling28d.periodEnd} (取得遅延 ${periods.delayDays} 日・anchor=${periods.anchor})`,
  );
  console.log(summaryLines.join("\n"));
  if (summary.wowBlockedReason) {
    console.warn(`[ga4-snapshot] ⚠ ${summary.wowBlockedReason}`);
  }
  if (errors.length > 0) {
    console.warn(`[ga4-snapshot] ${errors.length} report(s) failed (partial results saved — check-period-contract が検出する):`);
    errors.forEach((e) => console.warn(" -", e));
    // 全 report 失敗のみ exit 1 (source 内 failure isolation。partial は summary.json が保持する)
    if (summaryLines.length <= 1) process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("GA4 snapshot failed:", e.message || e);
  if (e.errors) console.error(e.errors);
  process.exit(1);
});
