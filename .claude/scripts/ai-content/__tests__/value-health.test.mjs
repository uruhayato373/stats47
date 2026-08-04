/**
 * value-health.mjs のテスト
 *   node --test .claude/scripts/ai-content/__tests__/value-health.test.mjs
 *
 * 全部 PASS が「正しく通した」のか「何も見ていない」のかを区別できるよう、
 * **通すケースと落とすケースを対で置く**。実データで確認した 3 件 (2026-08-04 実測) を
 * そのまま検体にして、ゲートが実在の欠陥を捕まえることを固定する。
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PREFECTURE_COUNT,
  THIN_COVERAGE_THRESHOLD,
  checkValueHealth,
  latestPartition,
} from "../lib/value-health.mjs";

/** 健全な 47 県分の行 (値は全部違う) */
function healthyRows(n = PREFECTURE_COUNT) {
  return Array.from({ length: n }, (_, i) => ({
    areaCode: String(i + 1).padStart(2, "0") + "000",
    areaName: `県${i + 1}`,
    value: 100 + i,
  }));
}

const codes = (v) => v.blockers.map((b) => b.code);
const warnCodes = (v) => v.warns.map((w) => w.code);

test("健全な 47 県は通す", () => {
  const v = checkValueHealth(healthyRows());
  assert.equal(v.ok, true, `想定外の blocker: ${codes(v).join(",")}`);
  assert.deepEqual(warnCodes(v), []);
});

test("対象外県がある指標 (39 行) も blocker にはしない", () => {
  // port-* / fishery-* 系は内陸 8 県が対象外で 39 件前後が正常。ここを落とすと 34 件が
  // 恒久的にキューから消える (2026-08-04 実測)。
  const v = checkValueHealth(healthyRows(39));
  assert.equal(v.ok, true);
  assert.deepEqual(warnCodes(v), ["thin-coverage"]);
});

test("全県が同じ値なら落とす — bowling-alley-public 2021 の実形", () => {
  const rows = healthyRows().map((r) => ({ ...r, value: 0 }));
  const v = checkValueHealth(rows);
  assert.equal(v.ok, false);
  assert.deepEqual(codes(v), ["no-variance"]);
  assert.match(v.blockers[0].message, /順位が成立しない/);
});

test("全県同値は 0 以外でも落とす (0 決め打ちにしない)", () => {
  const v = checkValueHealth(healthyRows().map((r) => ({ ...r, value: 3.5 })));
  assert.deepEqual(codes(v), ["no-variance"]);
});

test("1 県だけ違えば順位は成立する (境界)", () => {
  const rows = healthyRows().map((r, i) => ({ ...r, value: i === 0 ? 1 : 0 }));
  assert.equal(checkValueHealth(rows).ok, true);
});

test("同一県が複数行なら落とす — convenience-store-count-commercial 2025 の実形", () => {
  const v = checkValueHealth([...healthyRows(), ...healthyRows()]);
  assert.equal(v.ok, false);
  assert.ok(codes(v).includes("duplicate-area"), codes(v).join(","));
  assert.ok(codes(v).includes("over-coverage"), codes(v).join(","));
});

test("47 を超えたら落とす (県重複が無くても)", () => {
  const rows = healthyRows(48).map((r, i) => ({ ...r, areaCode: `x${i}`, areaName: `x${i}` }));
  assert.deepEqual(codes(checkValueHealth(rows)), ["over-coverage"]);
});

test("0 行は落とす", () => {
  assert.deepEqual(codes(checkValueHealth([])), ["no-rows"]);
  assert.deepEqual(codes(checkValueHealth(undefined)), ["no-rows"]);
});

test("有限な数値が 1 件も無ければ落とす", () => {
  const rows = healthyRows().map((r) => ({ ...r, value: null }));
  assert.deepEqual(codes(checkValueHealth(rows)), ["no-finite-value"]);
});

test("値の欠けは warn (行はあるので順位自体は成立しうる)", () => {
  const rows = healthyRows().map((r, i) => (i < 3 ? { ...r, value: null } : r));
  const v = checkValueHealth(rows);
  assert.equal(v.ok, true);
  assert.deepEqual(warnCodes(v), ["null-value"]);
});

test("NaN / Infinity は数値として数えない", () => {
  const rows = healthyRows().map((r, i) =>
    i === 0 ? { ...r, value: NaN } : i === 1 ? { ...r, value: Infinity } : { ...r, value: 7 },
  );
  const v = checkValueHealth(rows);
  // 残り 45 件が全部 7 = 順位が成立しない
  assert.ok(codes(v).includes("no-variance"), codes(v).join(","));
  assert.ok(warnCodes(v).includes("null-value"));
});

test("thin-coverage の境界は THIN_COVERAGE_THRESHOLD ちょうどで切り替わる", () => {
  assert.deepEqual(warnCodes(checkValueHealth(healthyRows(THIN_COVERAGE_THRESHOLD))), []);
  assert.deepEqual(warnCodes(checkValueHealth(healthyRows(THIN_COVERAGE_THRESHOLD - 1))), [
    "thin-coverage",
  ]);
});

test("latestPartition は並び順でなく yearCode の最大を採る", () => {
  const payload = {
    partitions: [
      { yearCode: "2011", values: [{ areaCode: "01000", value: 1 }] },
      { yearCode: "2021", values: [{ areaCode: "01000", value: 9 }] },
      { yearCode: "2018", values: [{ areaCode: "01000", value: 5 }] },
    ],
  };
  const { yearCode, rows } = latestPartition(payload);
  assert.equal(yearCode, "2021");
  assert.equal(rows[0].value, 9);
});

test("latestPartition は partitions 不在でも落ちない", () => {
  assert.deepEqual(latestPartition(undefined), { yearCode: null, rows: [] });
  assert.deepEqual(latestPartition({ partitions: [] }), { yearCode: null, rows: [] });
});
