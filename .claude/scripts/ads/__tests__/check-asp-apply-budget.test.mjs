import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { appliedDates, isoWeekStart, applyBudget, toJstDate } = require("../check-asp-apply-budget.cjs");

const catalog = {
  programs: {
    "moshimo-1": {
      asps: {
        moshimo: {
          promotionId: "1",
          history: [
            { at: "2026-07-28T08:00:00.000Z", status: "applying" },
            { at: "2026-07-29T08:00:00.000Z", status: "applying" },
          ],
        },
      },
    },
    "moshimo-2": {
      asps: {
        moshimo: { promotionId: "2", history: [{ at: "2026-07-20T08:00:00.000Z", status: "applying" }] },
        afb: { pid: "9", history: [{ at: "2026-07-28T08:00:00.000Z", status: "applying" }] },
      },
    },
    // 申請以外の履歴は数えない
    "moshimo-3": {
      asps: { moshimo: { promotionId: "3", history: [{ at: "2026-07-28T08:00:00.000Z", status: "approved" }] } },
    },
  },
};

test("appliedDates: applying だけを JST 日付で集める", () => {
  assert.deepEqual(appliedDates(catalog, "moshimo"), ["2026-07-20", "2026-07-28", "2026-07-29"]);
  assert.deepEqual(appliedDates(catalog, "afb"), ["2026-07-28"]);
});

test("appliedDates: ASP ごとに独立している (他 ASP の申請を数えない)", () => {
  assert.equal(appliedDates(catalog, "moshimo").length, 3);
  assert.equal(appliedDates(catalog, "afb").length, 1);
});

test("isoWeekStart: 週の月曜を返す", () => {
  assert.equal(isoWeekStart("2026-07-28"), "2026-07-27"); // 火 → 前日の月
  assert.equal(isoWeekStart("2026-07-27"), "2026-07-27"); // 月 → 当日
  assert.equal(isoWeekStart("2026-08-02"), "2026-07-27"); // 日 → 同じ週
});

test("toJstDate: UTC 深夜は JST では翌日 (申請日を日本時間で数える)", () => {
  assert.equal(toJstDate("2026-07-27T16:00:00.000Z"), "2026-07-28");
  assert.equal(toJstDate("2026-07-27T14:59:00.000Z"), "2026-07-27");
});

test("applyBudget: 同じ週の件数だけを数え、残枠を返す", () => {
  const b = applyBudget(catalog, "moshimo", "2026-07-28", 10);
  assert.equal(b.weekStart, "2026-07-27");
  assert.equal(b.weekCount, 2); // 07-28 と 07-29 (07-20 は前週)
  assert.equal(b.remaining, 8);
  assert.equal(b.ok, true);
});

test("applyBudget: 上限に達したら ok=false (残枠は負にしない)", () => {
  const b = applyBudget(catalog, "moshimo", "2026-07-28", 2);
  assert.equal(b.ok, false);
  assert.equal(b.remaining, 0);
});

test("applyBudget: 履歴が無い ASP は満枠", () => {
  const b = applyBudget({ programs: {} }, "moshimo", "2026-07-28", 10);
  assert.equal(b.weekCount, 0);
  assert.equal(b.remaining, 10);
  assert.equal(b.ok, true);
});
