import assert from "node:assert/strict";
import { test } from "node:test";

import { aspRevenueLines, ASP_OBSERVATION_MAX_AGE_DAYS, productRevenueLine } from "../nsm-revenue-lines.mjs";

/**
 * 週次収益 (NSM) の ASP 別の行 (2026-09-25 NSM-ASP-REVENUE-01)。
 * 守りたいのは「欠測・認証切れ・古い観測を 0 円にしない」と「本当に 0 件の成功は ¥0 と言い切る」の区別。
 */
const AS_OF = new Date("2026-09-27T00:00:00Z");
const pass = (source, extra = {}) => ({ source, status: "pass", code: null, observedAt: "2026-09-24T14:15:00Z", ...extra });
const authRequired = (source) => ({
  source, status: "failed", code: "auth_required", observedAt: "2026-09-24T14:15:00Z",
  recovery: { state: "awaiting_reauthentication", blockedSince: "2026-09-21T12:30:00Z" },
});
const A8 = { records: [
  { month: "2026-08", conversions: 9, approved: 9, revenueYen: 900 },
  { month: "2026-09", conversions: 2, approved: 1, revenueYen: 150 },
  { month: "2026-09", conversions: 1, approved: 0, revenueYen: 0 },
] };
test("成功した ASP は最新月の発生と確定を件数と金額で出す", () => {
  const [a8] = aspRevenueLines({ authLatest: { sources: [pass("a8")] }, a8Results: A8, asOf: AS_OF });
  assert.match(a8, /2026-09 月累計.*発生 \*\*3 件\*\*.*確定 \*\*1 件・¥150\*\*/);
});

test("認証切れは 0 円ではなく判定不能と理由を出す (記録ファイルが残っていても使わない)", () => {
  const [a8] = aspRevenueLines({ authLatest: { sources: [authRequired("a8")] }, a8Results: A8, asOf: AS_OF });
  assert.match(a8, /判定不能/);
  assert.match(a8, /認証切れ（2026-09-21 から）/);
  assert.doesNotMatch(a8, /¥/);
});

test("古い観測・記録なしはどれも判定不能", () => {
  const old = new Date(AS_OF.getTime() + (ASP_OBSERVATION_MAX_AGE_DAYS + 5) * 86_400_000);
  const [empty] = aspRevenueLines({ authLatest: { sources: [pass("a8")] }, a8Results: { records: [] }, asOf: AS_OF });
  assert.match(empty, /判定不能.*記録が無い/);
  const [stale] = aspRevenueLines({ authLatest: { sources: [pass("a8")] }, a8Results: A8, asOf: old });
  assert.match(stale, /判定不能.*日前/);
});

test("集約後は A8 と楽天の 2 行だけを出し、もしも・afb の行を出さない (ASP-CONSOLIDATE-A8-RAKUTEN-01)", () => {
  // 計測から外した取得元が latest.json に残っていても、判定不能の行として週次収益に混ぜない
  const lines = aspRevenueLines({ authLatest: { sources: [pass("a8"), pass("moshimo"), pass("afb")] }, a8Results: A8, asOf: AS_OF });
  assert.equal(lines.length, 2);
  assert.ok(lines.every((line) => !/もしも|afb/.test(line)));
});

test("latest.json が無ければ認証付き収集の ASP 全体を判定不能にする (手入力の楽天は別の行)", () => {
  const lines = aspRevenueLines({ authLatest: null, a8Results: A8, asOf: AS_OF });
  assert.equal(lines[0], "- ASP の成果: **判定不能**（認証付き収集の結果 latest.json が無い）");
  assert.match(lines[1], /^- 楽天: \*\*判定不能\*\*/);
  assert.equal(lines.length, 2);
});

/**
 * 商品の行 (2026-09-25)。以前は台帳が空なら「¥0」、記録があっても存在しない `date` / `amountYen` を読んで常に ¥0 だった。
 * 実売台帳は CLI で手入力する経路しか無いので、販売中の商品がある限り空の台帳は「未計測」。
 */
const WEEK = { weekStart: "2026-09-21", weekEnd: "2026-09-27" };
const obs = (periodEnd, netRevenueYen) => ({ periodEnd, netRevenueYen, periodStart: "2026-09-01" });

test("販売中の商品があるのに記録 0 件なら ¥0 ではなく判定不能", () => {
  const line = productRevenueLine({ ledger: { observations: [] }, liveProductCount: 3, ...WEEK });
  assert.match(line, /判定不能.*販売中が少なくとも 3 点/);
  assert.doesNotMatch(line, /¥0/);
});

test("販売中の商品が無く記録も無ければ ¥0 と言い切る", () => {
  assert.equal(productRevenueLine({ ledger: { observations: [] }, liveProductCount: 0, ...WEEK }), "- 商品: **¥0**（販売中の商品なし）");
});

test("期間末が今週の記録だけを手取り (netRevenueYen) で合計する", () => {
  const line = productRevenueLine({
    ledger: { observations: [obs("2026-09-27", 1200), obs("2026-09-22", 300), obs("2026-09-14", 9999)] },
    liveProductCount: 3, ...WEEK,
  });
  assert.match(line, /\*\*¥1,500\*\*.*2 件/);
});

test("台帳が壊れている・販売中の数が読めないときは判定不能", () => {
  assert.match(productRevenueLine({ ledger: null, liveProductCount: 3, ...WEEK }), /判定不能/);
  assert.match(productRevenueLine({ ledger: { observations: [] }, liveProductCount: null, ...WEEK }), /判定不能/);
});

// 楽天 (2026-10-01): 成果 API が無く週次レビューで手入力する。記録し忘れた週を 0 円にしないことを固定する。
test("楽天: 未記録・古い記録は判定不能、新しい記録は最新月の発生と確定を出す", async () => {
  const { rakutenLine } = await import("../nsm-revenue-lines.mjs");
  assert.match(rakutenLine(null, AS_OF), /楽天: \*\*判定不能\*\*（未記録/);
  const old = { records: [{ month: "2026-08", orders: 2, estimatedYen: 300, confirmedYen: 100, observedAt: "2026-09-01T00:00:00Z" }] };
  assert.match(rakutenLine(old, AS_OF), /判定不能.*26 日前/);
  const fresh = { records: [
    { month: "2026-08", orders: 2, estimatedYen: 300, confirmedYen: 100, observedAt: "2026-09-20T00:00:00Z" },
    { month: "2026-09", orders: 1, estimatedYen: 120, confirmedYen: null, observedAt: "2026-09-26T00:00:00Z" },
  ] };
  assert.match(rakutenLine(fresh, AS_OF), /2026-09 月累計.*発生 \*\*1 件・¥120\*\* \/ 確定 \*\*未確定\*\*/);
  const lines = aspRevenueLines({ authLatest: null, a8Results: null, rakutenResults: fresh, asOf: AS_OF });
  assert.equal(lines.length, 2, "認証付き収集が無くても楽天の行は出す");
});
