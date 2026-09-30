import test from "node:test";
import assert from "node:assert/strict";
import { weeklyProductRevenue } from "../lib/product-revenue.mjs";
import { productRevenueLine } from "../nsm-revenue-lines.mjs";
import { parseCoconalaRevenue } from "../../measurement/report-parsers.mjs";

/**
 * 商品の週次実売 (2026-09-30)。守りたいのは「累積の差分で週を出す」「欠測を ¥0 にしない」
 * 「累積が ¥0 なら基準点が無くても ¥0 と言い切る」の 3 点。
 */
const WEEK = { weekStart: "2026-09-21", weekEnd: "2026-09-27" };
const kdpDays = (royaltyYen, paidOrders = 0, n = 7) =>
  Array.from({ length: n }, (_, i) => ({ channel: "kdp", date: `2026-09-${21 + i}`, royaltyYen, paidOrders }));
const history = (...entries) => ({ schemaVersion: 1, entries: entries.flat() });

test("ココナラは累積の差分、KDP は 7 日分の見積りを表示するが合計には入れない", () => {
  const week = weeklyProductRevenue({
    revenueHistory: history(
      { channel: "coconala", date: "2026-09-20", cumulativeYen: 1000 },
      { channel: "coconala", date: "2026-09-27", cumulativeYen: 3500 },
      kdpDays(100, 1),
      { channel: "note", date: "2026-09-20", month: "2026-09", monthToDateYen: 500, closedMonths: {} },
      { channel: "note", date: "2026-09-26", month: "2026-09", monthToDateYen: 800, closedMonths: {} },
    ),
    ...WEEK,
  });
  assert.equal(week.status, "ok");
  assert.equal(week.channels.coconala.yen, 2500);
  assert.equal(week.channels.kdp.yen, 700);
  assert.equal(week.channels.note.yen, 300);
  // KDP の見積り ¥700 は確定ロイヤリティではないので合計に入れない。注文数は件数に入れる
  assert.equal(week.yen, 2500 + 300);
  assert.equal(week.channels.kdp.estimate, true);
});

test("KDP の日別が欠けた週・基準点の無い正の累積は判定不能にし、¥0 にしない", () => {
  const week = weeklyProductRevenue({
    revenueHistory: history({ channel: "coconala", date: "2026-09-25", cumulativeYen: 3000 }, kdpDays(0, 0, 6)),
    ...WEEK,
  });
  assert.equal(week.status, "unmeasurable");
  assert.equal(week.yen, null);
  assert.match(week.channels.kdp.note, /6\/7/);
  assert.match(week.channels.coconala.note, /基準点/);
  assert.match(week.channels.note.note, /観測が無い/);
});

test("累積 ¥0 の観測は基準点が無くても今週 ¥0 と確定する", () => {
  const week = weeklyProductRevenue({
    revenueHistory: history(
      { channel: "coconala", date: "2026-09-26", cumulativeYen: 0 },
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
    revenueHistory: history({ channel: "coconala", date: "2026-09-26", cumulativeYen: 0 }, kdpDays(0, 0, 3)),
  });
  assert.match(line, /判定不能.*ココナラ ¥0.*KDP 判定不能（日別の観測 3\/7 日）/);
});

test("ココナラ売上管理はサービス欄の今月・累積だけを読み、画面が変わったら止める", () => {
  const text = "売上金残高合計\n9,999 円\n売上実績\nサービス\n今月の売上\n1,200 円\n累積売上\n34,560 円\nブログ\n累積売上\n777 円\n売上履歴";
  assert.deepEqual(parseCoconalaRevenue(text), { schemaVersion: 1, scope: "service-net-revenue", monthToDateYen: 1200, cumulativeYen: 34560 });
  assert.throws(() => parseCoconalaRevenue("売上実績\nサービス\n売上履歴"), /report_schema_changed/);
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
