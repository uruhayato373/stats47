import test from "node:test";
import assert from "node:assert/strict";
import { weeklyProductRevenue } from "../lib/product-revenue.mjs";
import { productRevenueLine } from "../nsm-revenue-lines.mjs";

/**
 * 商品の週次実売 (2026-09-30)。守りたいのは「欠測を ¥0 にしない」「KDP の見積りを合計に入れない」
 * 「note の月またぎを締め額で継ぐ」の 3 点。ココナラは 2026-10-19 の撤退で集計から外した。
 */
const WEEK = { weekStart: "2026-09-21", weekEnd: "2026-09-27" };
const kdpDays = (royaltyYen, paidOrders = 0, n = 7) =>
  Array.from({ length: n }, (_, i) => ({ channel: "kdp", date: `2026-09-${21 + i}`, royaltyYen, paidOrders }));
const history = (...entries) => ({ schemaVersion: 1, entries: entries.flat() });

test("KDP は 7 日分の見積りを表示するが合計には入れず、ココナラは集計しない", () => {
  const week = weeklyProductRevenue({
    revenueHistory: history(
      { channel: "coconala", date: "2026-09-27", cumulativeYen: 3500 },
      kdpDays(100, 1),
      { channel: "note", date: "2026-09-20", month: "2026-09", monthToDateYen: 500, closedMonths: {} },
      { channel: "note", date: "2026-09-26", month: "2026-09", monthToDateYen: 800, closedMonths: {} },
    ),
    ...WEEK,
  });
  assert.equal(week.status, "ok");
  assert.equal(week.channels.coconala, undefined);
  assert.equal(week.channels.kdp.yen, 700);
  assert.equal(week.channels.note.yen, 300);
  // KDP の見積り ¥700 は確定ロイヤリティではないので合計に入れない。注文数は件数に入れる
  assert.equal(week.yen, 300);
  assert.equal(week.channels.kdp.estimate, true);
});

test("KDP の日別が欠けた週・観測の無い note は判定不能にし、¥0 にしない", () => {
  const week = weeklyProductRevenue({
    revenueHistory: history(kdpDays(0, 0, 6)),
    ...WEEK,
  });
  assert.equal(week.status, "unmeasurable");
  assert.equal(week.yen, null);
  assert.match(week.channels.kdp.note, /6\/7/);
  assert.match(week.channels.note.note, /観測が無い/);
});

test("全チャネルの観測がそろった ¥0 の週は ¥0 と確定する", () => {
  const week = weeklyProductRevenue({
    revenueHistory: history(
      { channel: "note", date: "2026-09-20", month: "2026-09", monthToDateYen: 0, closedMonths: {} },
      { channel: "note", date: "2026-09-26", month: "2026-09", monthToDateYen: 0, closedMonths: {} },
      kdpDays(0),
    ),
    ...WEEK,
  });
  assert.equal(week.status, "ok");
  assert.equal(week.yen, 0);
  assert.equal(week.count, 0);
});

test("note は月をまたぐ週を前月の締め額で継ぎ、締め額が無ければ判定不能", () => {
  const monthEnd = { weekStart: "2026-09-28", weekEnd: "2026-10-04" };
  const base = { channel: "note", date: "2026-09-27", month: "2026-09", monthToDateYen: 1000, closedMonths: {} };
  const closed = weeklyProductRevenue({ revenueHistory: history(base,
    { channel: "note", date: "2026-10-04", month: "2026-10", monthToDateYen: 200, closedMonths: { "2026-09": 1300 } }), ...monthEnd });
  assert.equal(closed.channels.note.yen, 300 + 200);
  const open = weeklyProductRevenue({ revenueHistory: history(base,
    { channel: "note", date: "2026-10-04", month: "2026-10", monthToDateYen: 200, closedMonths: {} }), ...monthEnd });
  assert.equal(open.channels.note.status, "unmeasurable");
});

test("台帳に今週の記録が無いとき、NSM の商品行は日次履歴の内訳を出す", () => {
  const line = productRevenueLine({
    ledger: { observations: [] }, liveProductCount: 3, ...WEEK,
    revenueHistory: history(kdpDays(0, 0, 3)),
  });
  assert.match(line, /判定不能.*KDP 判定不能（日別の観測 3\/7 日）/);
  assert.doesNotMatch(line, /ココナラ/);
});

test("note の売上 API は今月と締め済み月だけを読み、再確認切れは値を作らず止める", async () => {
  const { parseNoteSales } = await import("../../measurement/report-parsers.mjs");
  const body = { data: { start_date: "2026/09/01", total_current_month_sales: 600, unpaid_sales_total: 900,
    total_sales: [{ date: "202607", sales: 300 }, { date: "202606", sales: 300 }] } };
  assert.deepEqual(parseNoteSales(body, "2026-09-30"),
    { date: "2026-09-30", month: "2026-09", monthToDateYen: 600, closedMonths: { "2026-07": 300, "2026-06": 300 } });
  assert.throws(() => parseNoteSales({ error: { code: "user_verification_needed" } }, "2026-09-30"), /verification_required/);
  assert.throws(() => parseNoteSales({ data: { start_date: "2026/09/01", total_sales: [] } }, "2026-09-30"), /report_schema_changed/);
});
