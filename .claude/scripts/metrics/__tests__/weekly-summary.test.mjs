/**
 * weekly-summary.mjs のテスト — 集計・WoW 抑止・履歴 schema 移行・LATEST 描画。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aggregateGscDaily,
  computeWow,
  buildGscSummary,
  buildGa4Summary,
  migrateGscHistoryRows,
  migrateGa4HistoryRows,
  gscFinalizedHistoryRow,
  ga4FinalizedHistoryRow,
  renderGscLatest,
  renderGa4Latest,
} from "../lib/weekly-summary.mjs";

const NOW = "2026-07-26T11:00:00Z";

/** 2026-06-26..07-23 (rolling28d) の全日を value=1 clicks / 100 imps / pos 8 で埋める。 */
function fullDailyRows({ from = "2026-06-26", days = 28, clicks = 1, impressions = 100, position = 8 } = {}) {
  const rows = [];
  let d = new Date(from + "T00:00:00Z");
  for (let i = 0; i < days; i++) {
    rows.push({
      date: d.toISOString().slice(0, 10),
      clicks,
      impressions,
      ctr: clicks / impressions,
      position,
    });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return rows;
}

test("buildGscSummary: 完全データで finalized7d/previous7d/rolling28d と WoW を返す", () => {
  const s = buildGscSummary({ week: "2026-W30", now: NOW, dailyRows: fullDailyRows() });
  assert.equal(s.weekId, "2026-W30");
  assert.equal(s.finalized7d.periodStart, "2026-07-17");
  assert.equal(s.finalized7d.periodEnd, "2026-07-23");
  assert.equal(s.finalized7d.kpis.clicks, 7);
  assert.equal(s.finalized7d.kpis.impressions, 700);
  assert.equal(s.previous7d.kpis.clicks, 7);
  assert.equal(s.rolling28d.kpis.clicks, 28);
  assert.equal(s.finalized7d.windowDays, 7);
  assert.equal(s.rolling28d.windowDays, 28);
  assert.equal(s.finalized7d.isFinalized, true);
  assert.ok(s.generatedAt);
  assert.equal(s.finalized7d.coverage.status, "complete");
  assert.ok(s.wow);
  assert.equal(s.wow.clicks.delta, 0);
  assert.equal(s.wowBlockedReason, null);
});

test("buildGscSummary: 欠損日があると WoW を停止し理由と欠損日を返す (0 補完しない)", () => {
  const rows = fullDailyRows().filter((r) => r.date !== "2026-07-20");
  const s = buildGscSummary({ week: "2026-W30", now: NOW, dailyRows: rows });
  assert.equal(s.wow, null);
  assert.match(s.wowBlockedReason, /insufficient-data/);
  assert.match(s.wowBlockedReason, /2026-07-20/);
  assert.equal(s.finalized7d.coverage.status, "partial");
  assert.deepEqual(s.finalized7d.coverage.missingDates, ["2026-07-20"]);
  // 欠損日は 0 補完されない: clicks は 6 日分 (=6) であり 7 ではない
  assert.equal(s.finalized7d.kpis.clicks, 6);
  // KPI 履歴行にしない (partial を確定値として記録しない)
  assert.equal(gscFinalizedHistoryRow(s), null);
});

test("buildGscSummary: W30 実データ相当の値 (証拠値の保全)", () => {
  // 実 daily.csv (06-27..07-24) の 07-10..23 と同じ形の値を合成して検算
  const rows = [
    // previous7d 07-10..16 = 823 clicks / 25464 imps
    { date: "2026-07-10", clicks: 118, impressions: 3638, position: 8.2 },
    { date: "2026-07-11", clicks: 117, impressions: 3636, position: 8.2 },
    { date: "2026-07-12", clicks: 118, impressions: 3638, position: 8.1 },
    { date: "2026-07-13", clicks: 117, impressions: 3638, position: 8.2 },
    { date: "2026-07-14", clicks: 118, impressions: 3638, position: 8.2 },
    { date: "2026-07-15", clicks: 117, impressions: 3638, position: 8.2 },
    { date: "2026-07-16", clicks: 118, impressions: 3638, position: 8.2 },
    // finalized7d 07-17..23 = 892 clicks / 23239 imps
    { date: "2026-07-17", clicks: 127, impressions: 3320, position: 8.1 },
    { date: "2026-07-18", clicks: 127, impressions: 3320, position: 8.1 },
    { date: "2026-07-19", clicks: 128, impressions: 3320, position: 8.1 },
    { date: "2026-07-20", clicks: 127, impressions: 3320, position: 8.1 },
    { date: "2026-07-21", clicks: 128, impressions: 3320, position: 8.1 },
    { date: "2026-07-22", clicks: 127, impressions: 3319, position: 8.1 },
    { date: "2026-07-23", clicks: 128, impressions: 3320, position: 8.1 },
  ];
  const s = buildGscSummary({ week: "2026-W30", now: NOW, dailyRows: rows });
  assert.equal(s.finalized7d.kpis.clicks, 892);
  assert.equal(s.finalized7d.kpis.impressions, 23239);
  assert.equal(s.previous7d.kpis.clicks, 823);
  assert.equal(s.previous7d.kpis.impressions, 25464);
  // CTR 3.84% / 3.23%
  assert.equal(s.finalized7d.kpis.ctr, 0.0384);
  assert.equal(s.previous7d.kpis.ctr, 0.0323);
  // rolling28d は 06-26 以降が欠けるので partial (この合成データでは 14 日分のみ)
  assert.equal(s.rolling28d.coverage.status, "partial");
});

test("buildGa4Summary: Japan-only totals + coverage 完全で WoW を返し、pollution を分離する", () => {
  const dailyClean = fullDailyRows({ from: "2026-07-12", days: 14 }); // 07-12..07-25
  const s = buildGa4Summary({
    week: "2026-W30",
    now: NOW,
    finalizedTotals: { activeUsers: 400, sessions: 500, engagedSessions: 300, screenPageViews: 900 },
    previousTotals: { activeUsers: 380, sessions: 480, engagedSessions: 280, screenPageViews: 850 },
    dailyCleanRows: dailyClean,
    rawFinalizedTotals: { sessions: 700 },
  });
  assert.equal(s.jpFinalized7d.periodStart, "2026-07-19");
  assert.equal(s.jpFinalized7d.periodEnd, "2026-07-25");
  assert.equal(s.jpFinalized7d.kpis.sessions, 500);
  assert.equal(s.jpFinalized7d.kpis.engagementRate, 0.6);
  assert.ok(s.wow);
  assert.equal(s.wow.sessions.delta, 20);
  // pollution: raw 700 - jp 500 = 200。KPI には混ざらない
  assert.equal(s.pollution.pollutedSessions, 200);
  assert.equal(s.jpFinalized7d.kpis.sessions, 500);
  const row = ga4FinalizedHistoryRow(s);
  assert.equal(row.sessions_jp7d, 500);
  assert.equal(row.week, "2026-W30");
});

test("buildGa4Summary: 日別 clean 行の欠損で WoW 停止 + KPI 履歴行なし", () => {
  const dailyClean = fullDailyRows({ from: "2026-07-12", days: 14 }).filter(
    (r) => r.date !== "2026-07-24",
  );
  const s = buildGa4Summary({
    week: "2026-W30",
    now: NOW,
    finalizedTotals: { activeUsers: 400, sessions: 500, engagedSessions: 300, screenPageViews: 900 },
    previousTotals: { activeUsers: 380, sessions: 480, engagedSessions: 280, screenPageViews: 850 },
    dailyCleanRows: dailyClean,
  });
  assert.equal(s.wow, null);
  assert.match(s.wowBlockedReason, /2026-07-24/);
  assert.equal(ga4FinalizedHistoryRow(s), null);
});

test("computeWow: null 安全 (どちらかが null なら delta/pct とも null)", () => {
  const w = computeWow({ a: 10, b: null }, { a: 5, b: 3 }, ["a", "b"]);
  assert.equal(w.a.delta, 5);
  assert.equal(w.a.pct, 100);
  assert.equal(w.b.delta, null);
});

test("migrateGscHistoryRows: 旧列名を *_rolling28d へ改名し値を保全する (冪等)", () => {
  const legacy = [
    { week: "2026-W30", clicks: "3224", impressions: "95831", ctr: "0.0336", position: "8.11", rows_queries: "2083", rows_pages: "2729" },
  ];
  const { rows, migrated } = migrateGscHistoryRows(legacy);
  assert.equal(migrated, true);
  assert.equal(rows[0].clicks_rolling28d, "3224");
  assert.equal(rows[0].impressions_rolling28d, "95831");
  assert.equal(rows[0].clicks, undefined);
  // 冪等: 既に v2 なら変更なし
  const again = migrateGscHistoryRows(rows);
  assert.equal(again.migrated, false);
  assert.deepEqual(again.rows, rows);
});

test("migrateGa4HistoryRows: 行ごとに basis を付与し値を保全する", () => {
  const legacy = [
    { week: "2026-W20", active_users: "1500", sessions: "1800", pageviews: "5000" },
    { week: "2026-W29", active_users: "1700", sessions: "2000", pageviews: "5500" },
  ];
  const { rows, migrated } = migrateGa4HistoryRows(legacy, (w) => w >= "2026-W23");
  assert.equal(migrated, true);
  assert.equal(rows[0].basis, "raw-rolling28d");
  assert.equal(rows[1].basis, "jp-calendar-week");
  assert.equal(rows[1].active_users, "1700");
});

test("renderGscLatest: 確定7日と ローリング28日 を分離し、rolling に前週比を出さない", () => {
  const s = buildGscSummary({ week: "2026-W30", now: NOW, dailyRows: fullDailyRows() });
  const md = renderGscLatest({
    summary: s,
    rollingRows: [
      { week: "2026-W29", clicks_rolling28d: "2891", impressions_rolling28d: "92297", ctr_rolling28d: "0.0313", position_rolling28d: "8.20", rows_queries: "1967", rows_pages: "2566" },
      { week: "2026-W30", clicks_rolling28d: "3224", impressions_rolling28d: "95831", ctr_rolling28d: "0.0336", position_rolling28d: "8.11", rows_queries: "2083", rows_pages: "2729" },
    ],
    week: "2026-W30",
  });
  assert.match(md, /確定7日/);
  assert.match(md, /ローリング28日/);
  assert.match(md, /2026-07-17 〜 2026-07-23/);
  assert.ok(!md.includes("| 今週 |"), "曖昧な「今週」列を使わない");
  // rolling セクションの表に WoW/前週比の列が無い (単一値列のみ)
  const rollingSection = md.slice(md.indexOf("## ローリング28日"));
  assert.ok(!rollingSection.includes("| 前週比") && !rollingSection.includes("| WoW"));
  assert.match(rollingSection, /WoW と呼ばない/);
});

test("renderGscLatest: summary 不在/partial で insufficient-data を表示し WoW を出さない", () => {
  const rows = fullDailyRows().filter((r) => r.date !== "2026-07-20");
  const s = buildGscSummary({ week: "2026-W30", now: NOW, dailyRows: rows });
  const md = renderGscLatest({ summary: s, rollingRows: [], week: "2026-W30" });
  assert.match(md, /insufficient-data/);
  assert.ok(!md.includes("| Clicks | 6 |"), "partial KPI を確定値として表示しない");
  const none = renderGscLatest({ summary: null, rollingRows: [], week: "2026-W30" });
  assert.match(none, /summary が未生成/);
});

test("renderGa4Latest: jpFinalized7d KPI と legacy 基盤混在の注意を表示する", () => {
  const dailyClean = fullDailyRows({ from: "2026-07-12", days: 14 });
  const s = buildGa4Summary({
    week: "2026-W30",
    now: NOW,
    finalizedTotals: { activeUsers: 400, sessions: 500, engagedSessions: 300, screenPageViews: 900 },
    previousTotals: { activeUsers: 380, sessions: 480, engagedSessions: 280, screenPageViews: 850 },
    dailyCleanRows: dailyClean,
    rawFinalizedTotals: { sessions: 700 },
  });
  const md = renderGa4Latest({
    summary: s,
    legacyRows: [{ week: "2026-W30", basis: "jp-calendar-week", active_users: "1700", sessions: "2000", pageviews: "5500" }],
    week: "2026-W30",
  });
  assert.match(md, /jpFinalized7d/);
  assert.match(md, /pollution 監視: raw sessions 700/);
  assert.match(md, /jp-calendar-week/);
  assert.ok(!md.includes("| 今週 |"));
});
