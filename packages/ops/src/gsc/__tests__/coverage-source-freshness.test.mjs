import assert from "node:assert/strict";
import test from "node:test";

import {
  assertFreshCoverageSource,
  getCoverageSourceFreshness,
} from "../lib/coverage-source-freshness.mjs";

test("同じ ISO 週の GSC coverage 入力を受け入れる", () => {
  const actual = assertFreshCoverageSource({
    sourceWeek: "2026-W37",
    today: "2026-09-07",
    sourceObservedAt: "2026-09-07",
  });

  assert.equal(actual.currentWeek, "2026-W37");
  assert.equal(actual.ageWeeks, 0);
  assert.equal(actual.sourceObservedAt, "2026-09-07");
});

test("1 週前の GSC coverage 入力を許容する", () => {
  const actual = assertFreshCoverageSource({
    sourceWeek: "2026-W36",
    today: "2026-09-07",
  });

  assert.equal(actual.ageWeeks, 1);
  assert.equal(actual.sourceObservedAt, "2026-09-06");
});

test("許容期間を超えた入力を拒否する", () => {
  assert.throws(
    () =>
      assertFreshCoverageSource({
        sourceWeek: "2026-W32",
        today: "2026-09-07",
        sourceObservedAt: "2026-08-06",
      }),
    /5 週古い/
  );
});

test("実行週より未来の入力を拒否する", () => {
  assert.throws(
    () => assertFreshCoverageSource({ sourceWeek: "2026-W38", today: "2026-09-07" }),
    /未来/
  );
});

test("入力日と保存先週の不一致を拒否する", () => {
  assert.throws(
    () =>
      assertFreshCoverageSource({
        sourceWeek: "2026-W37",
        today: "2026-09-07",
        sourceObservedAt: "2026-08-06",
      }),
    /一致しません/
  );
});

test("年境界でも週齢を正しく計算する", () => {
  const actual = getCoverageSourceFreshness({
    sourceWeek: "2026-W53",
    today: "2027-01-04",
  });

  assert.equal(actual.currentWeek, "2027-W01");
  assert.equal(actual.ageWeeks, 1);
});
