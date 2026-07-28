/**
 * periods.mjs のテスト — 期間契約 (§18.2) の決定性・非重複・遅延・JST・跨ぎ・backfill 安全性。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DATA_DELAY_DAYS,
  addDays,
  jstDateOf,
  isoWeekOf,
  isoWeekRange,
  resolvePeriods,
  effectWindows,
  expectedDates,
  assessDailyCoverage,
} from "../lib/periods.mjs";

const NOW_W30_SUNDAY = "2026-07-26T11:00:00Z"; // JST 20:00 日曜 (cron 実行時刻)

test("遅延日数 SSOT: GSC=3 / GA4=1", () => {
  assert.equal(DATA_DELAY_DAYS.gsc, 3);
  assert.equal(DATA_DELAY_DAYS.ga4, 1);
});

test("W30 GSC: 明示 week から W30 証拠期間を決定的に再現する", () => {
  const p = resolvePeriods({ source: "gsc", week: "2026-W30", now: NOW_W30_SUNDAY });
  assert.equal(p.anchor, "2026-07-26");
  assert.deepEqual(p.finalized7d, { periodStart: "2026-07-17", periodEnd: "2026-07-23", windowDays: 7 });
  assert.deepEqual(p.previous7d, { periodStart: "2026-07-10", periodEnd: "2026-07-16", windowDays: 7 });
  assert.deepEqual(p.rolling28d, { periodStart: "2026-06-26", periodEnd: "2026-07-23", windowDays: 28 });
});

test("W30 GA4: 遅延 1 日で 07-19..07-25 / 直前 07-12..07-18", () => {
  const p = resolvePeriods({ source: "ga4", week: "2026-W30", now: NOW_W30_SUNDAY });
  assert.deepEqual(p.finalized7d, { periodStart: "2026-07-19", periodEnd: "2026-07-25", windowDays: 7 });
  assert.deepEqual(p.previous7d, { periodStart: "2026-07-12", periodEnd: "2026-07-18", windowDays: 7 });
});

test("finalized7d と previous7d は重複せず連続する", () => {
  for (const source of ["gsc", "ga4"]) {
    const p = resolvePeriods({ source, week: "2026-W30", now: NOW_W30_SUNDAY });
    assert.equal(addDays(p.previous7d.periodEnd, 1), p.finalized7d.periodStart);
    assert.equal(expectedDates(p.finalized7d).length, 7);
    assert.equal(expectedDates(p.previous7d).length, 7);
    const overlap = expectedDates(p.finalized7d).filter((d) =>
      expectedDates(p.previous7d).includes(d),
    );
    assert.deepEqual(overlap, []);
  }
});

test("週指定の期間は実行日に依存しない (1 ヶ月後の backfill でも同一)", () => {
  const later = resolvePeriods({ source: "gsc", week: "2026-W30", now: "2026-08-31T00:00:00Z" });
  const onTime = resolvePeriods({ source: "gsc", week: "2026-W30", now: NOW_W30_SUNDAY });
  assert.deepEqual(later.finalized7d, onTime.finalized7d);
  assert.deepEqual(later.previous7d, onTime.previous7d);
  assert.deepEqual(later.rolling28d, onTime.rolling28d);
});

test("未来週 (未確定) は失敗する — 現在データの過去/未来 week 誤ラベル防止", () => {
  // 2026-07-22 (水) 時点で当週 W30 を指定 → anchor=07-26 (日) は未来 → throw
  assert.throws(
    () => resolvePeriods({ source: "gsc", week: "2026-W30", now: "2026-07-22T03:00:00Z" }),
    /future/,
  );
  // 前週 W29 の backfill は成功する
  const p = resolvePeriods({ source: "gsc", week: "2026-W29", now: "2026-07-22T03:00:00Z" });
  assert.equal(p.finalized7d.periodEnd, "2026-07-16"); // W29 日曜 07-19 - 3
});

test("JST 日付境界: UTC 前日夜でも JST の日付で anchor が決まる", () => {
  // UTC 2026-07-25 15:30 = JST 2026-07-26 00:30 (日曜) → 週なし解決で anchor は 07-26
  const p = resolvePeriods({ source: "gsc", now: "2026-07-25T15:30:00Z" });
  assert.equal(p.anchor, "2026-07-26");
  assert.equal(jstDateOf("2026-07-25T15:30:00Z"), "2026-07-26");
  assert.equal(jstDateOf("2026-07-25T14:59:00Z"), "2026-07-25");
});

test("月跨ぎ: 2026-W31 の GSC finalized7d は 7 月末〜8 月頭を跨ぐ", () => {
  const p = resolvePeriods({ source: "gsc", week: "2026-W31", now: "2026-08-02T11:00:00Z" });
  // W31 日曜 = 2026-08-02、-3 = 07-30、-6 = 07-24
  assert.deepEqual(p.finalized7d, { periodStart: "2026-07-24", periodEnd: "2026-07-30", windowDays: 7 });
  assert.equal(p.previous7d.periodStart, "2026-07-17");
});

test("年跨ぎ: 2026-W53 (実在・年を跨ぐ) と 2025-W53 (非実在) を正しく扱う", () => {
  // 2026 年は 1/1 が木曜のため ISO 53 週が実在し、W53 は年を跨ぐ
  const r53 = isoWeekRange("2026-W53");
  assert.equal(r53.monday, "2026-12-28");
  assert.equal(r53.sunday, "2027-01-03");
  const p = resolvePeriods({ source: "gsc", week: "2026-W53", now: "2027-01-03T11:00:00Z" });
  assert.deepEqual(p.finalized7d, { periodStart: "2026-12-25", periodEnd: "2026-12-31", windowDays: 7 });
  assert.equal(p.previous7d.periodStart, "2026-12-18");
  // 2025 年は 52 週まで — 2025-W53 は非実在
  assert.throws(() => isoWeekRange("2025-W53"), /does not exist/);
  // 2027-W01 は 2027-01-04 開始 (前週 2026-W53 と連続)
  assert.equal(isoWeekRange("2027-W01").monday, "2027-01-04");
});

test("asOf backfill: 明示 as-of から決定的・week との不一致は失敗", () => {
  const p = resolvePeriods({ source: "ga4", asOf: "2026-07-26", now: "2026-08-15T00:00:00Z" });
  assert.equal(p.weekId, "2026-W30");
  assert.equal(p.finalized7d.periodEnd, "2026-07-25");
  assert.throws(
    () => resolvePeriods({ source: "ga4", week: "2026-W29", asOf: "2026-07-26", now: "2026-08-15T00:00:00Z" }),
    /not in week/,
  );
});

test("unknown source は失敗する (adsense は 2026-07-28 に正式追加済)", () => {
  assert.throws(() => resolvePeriods({ source: "psi", week: "2026-W30", now: NOW_W30_SUNDAY }), /unknown source/);
  assert.equal(DATA_DELAY_DAYS.adsense, 1);
});

test("effectWindows: baseline から 14/28/56 日", () => {
  assert.deepEqual(effectWindows("2026-07-23"), {
    day14: "2026-08-06",
    day28: "2026-08-20",
    day56: "2026-09-17",
  });
});

test("assessDailyCoverage: 欠損日を 0 補完せず列挙する", () => {
  const period = { periodStart: "2026-07-17", periodEnd: "2026-07-23" };
  const complete = assessDailyCoverage(period, [
    "2026-07-17", "2026-07-18", "2026-07-19", "2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23",
  ]);
  assert.equal(complete.status, "complete");
  assert.deepEqual(complete.missingDates, []);

  const partial = assessDailyCoverage(period, [
    "2026-07-17", "2026-07-18", "2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23",
  ]);
  assert.equal(partial.status, "partial");
  assert.deepEqual(partial.missingDates, ["2026-07-19"]);

  const missing = assessDailyCoverage(period, []);
  assert.equal(missing.status, "missing");
  assert.equal(missing.missingDates.length, 7);
});

test("isoWeekOf: 週境界 (月曜開始)", () => {
  assert.equal(isoWeekOf("2026-07-26"), "2026-W30"); // 日曜は同週
  assert.equal(isoWeekOf("2026-07-27"), "2026-W31"); // 月曜から次週
});
