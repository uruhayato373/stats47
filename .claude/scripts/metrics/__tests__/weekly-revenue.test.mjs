// 週次収益 (NSM) の内訳。KPI ツリーと管理画面のホームが同じ値を出すための約束を固定する。
import { test } from "node:test";
import assert from "node:assert/strict";

import { summarizeWeeklyRevenue, weeklyRevenueNode } from "../lib/weekly-revenue.mjs";

const week = "2026-W44";
const weekStart = "2026-10-26";
const weekEnd = "2026-11-01";
const asOf = new Date("2026-11-01T23:59:59Z");

const authLatest = {
  sources: [
    { source: "a8", status: "pass", observedAt: "2026-11-01T00:00:00Z" },
  ],
};
const a8Results = { records: [{ month: "2026-10", conversions: 2, approved: 1, revenueYen: 500 }] };
const rakutenResults = { records: [{ month: "2026-10", observedAt: "2026-11-01T00:00:00Z", orders: 3, estimatedYen: 120, confirmedYen: null, source: "collector:x" }] };
const kdpDays = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"]
  .map((date) => ({ channel: "kdp", date, royaltyYen: 100, paidOrders: 1 }));
const noteEntries = [
  { channel: "note", date: "2026-10-24", month: "2026-10", monthToDateYen: 1000 },
  { channel: "note", date: "2026-11-01", month: "2026-11", monthToDateYen: 200, closedMonths: { "2026-10": 1500 } },
];

function input(overrides = {}) {
  return {
    week, weekStart, weekEnd, asOf,
    adsenseHistory: [{ week, earnings: "313" }],
    revenueHistory: { entries: [...kdpDays, ...noteEntries] },
    authLatest, a8Results, rakutenResults,
    ...overrides,
  };
}

test("週の円が分かる AdSense と note だけを合計し、月累計の ASP と見積りの Kindle は合計に入れない", () => {
  const r = summarizeWeeklyRevenue(input());
  assert.equal(r.status, "ok");
  // note は 10 月の締め 1500 − 基準点 1000 + 11 月の今月 200 = 700
  assert.equal(r.totalYen, 313 + 700);
  const inTotal = r.channels.filter((c) => c.inTotal).map((c) => c.id);
  assert.deepEqual(inTotal, ["adsense", "note"]);
  assert.equal(r.channels.find((c) => c.id === "a8").yen, 500);
  assert.equal(r.channels.find((c) => c.id === "kdp").inTotal, false);
});

test("合計に入るチャネルが 1 つでも欠けたら合計を出さず、判定できた分と理由を残す (欠測を 0 円にしない)", () => {
  const r = summarizeWeeklyRevenue(input({ revenueHistory: { entries: kdpDays } }));
  assert.equal(r.status, "partial");
  assert.equal(r.totalYen, null);
  assert.equal(r.measuredYen, 313);
  const node = weeklyRevenueNode(r);
  assert.equal(node.status, "partial");
  assert.equal(node.value, null);
  assert.match(node.note, /判定できた分 ¥313/);
  assert.match(node.note, /note 判定不能/);
});

test("合計に入るチャネルがすべて欠けたら判定不能", () => {
  const r = summarizeWeeklyRevenue(input({ adsenseHistory: [], revenueHistory: { entries: [] } }));
  assert.equal(r.status, "unmeasurable");
  assert.equal(weeklyRevenueNode(r).status, "unmeasurable");
});

test("全チャネルがそろえば KPI ツリーの行に合計の値が入る", () => {
  const node = weeklyRevenueNode(summarizeWeeklyRevenue(input()));
  assert.equal(node.status, "ok");
  assert.equal(node.value, "1013");
});
