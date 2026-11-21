/**
 * 分析用の表の検査が守る意図 (2026-11-05 の手作業の分析で実際に踏んだもの):
 *   - 政令市と区の二重計上を合計の検算で止める
 *   - 値の無い行を 0 に読み替えない
 *   - 抜けた町の偏りを、残った自治体の結論に黙って混ぜない
 *   - 雑音の変化を順位にさせない。ただし計算は止めない (集団の傾向は読める)
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFrame,
  checkCoverage,
  checkReliability,
  checkTotal,
  checkYears,
  correlation,
  indexRows,
  summarize,
} from "../analysis-frame-core.mjs";

const row = (areaCode, yearCode, value) => ({ areaCode, yearCode, value });
const ENTITIES = [{ code: "01100", name: "札幌市" }, { code: "01202", name: "函館市" }];
const prefectures = (year, value) => Array.from({ length: 47 }, (_, i) => row(`${String(i + 1).padStart(2, "0")}000`, year, i === 0 ? value : 0));

test("値の無い行は 0 に読み替えない", () => {
  const frame = buildFrame({ entities: ENTITIES, metrics: [{ alias: "pop", rows: [row("01100", "2020", 100), row("01202", "2020", null)], years: [2020] }] });
  assert.equal(frame.rows[0].pop_2020, 100);
  assert.equal(frame.rows[1].pop_2020, null);
});

test("年を省くと最新年を取り、yearCode の桁の違いを吸収する", () => {
  assert.deepEqual(indexRows([row("01100", "2020100000", 5)]).get("01100"), { 2020: 5 });
  const frame = buildFrame({ entities: ENTITIES, metrics: [{ alias: "pop", rows: [row("01100", "2015", 1), row("01100", "2020", 2)] }] });
  assert.deepEqual(frame.columns.map((c) => c.column), ["pop_2020"]);
});

test("政令市と区が同居した全行の合計は使わず、公開の自治体の合計を県と比べる", () => {
  const rows = [row("01100", "2020", 80), row("01101", "2020", 80), row("01202", "2020", 20)];
  const result = checkTotal({ alias: "pop", year: "2020", rows, entities: ENTITIES, prefectureRows: prefectures("2020", 100) });
  assert.equal(result.allRows, 180);
  assert.equal(result.entitySum, 100);
  assert.equal(result.status, "ok");
});

test("公開の自治体でも二重に数えていれば止める", () => {
  const entities = [...ENTITIES, { code: "01101", name: "中央区" }];
  const rows = [row("01100", "2020", 80), row("01101", "2020", 80), row("01202", "2020", 20)];
  const total = checkTotal({ alias: "pop", year: "2020", rows, entities, prefectureRows: prefectures("2020", 100) });
  assert.equal(total.status, "mismatch");
  const summary = summarize({ totals: [total], years: { status: "ok" }, coverage: { status: "ok" }, reliability: [] });
  assert.equal(summary.ok, false);
});

test("県の値が無ければ合ったことにせず、検算できないと知らせる", () => {
  const total = checkTotal({ alias: "pop", year: "2020", rows: [row("01100", "2020", 80)], entities: ENTITIES, prefectureRows: null });
  assert.equal(total.status, "unverified");
  const summary = summarize({ totals: [total], years: { status: "ok" }, coverage: { status: "ok" }, reliability: [] });
  assert.equal(summary.ok, true);
  assert.match(summary.warnings.join(), /検算できない/);
});

test("抜けた町の中央値を出し、割合が低ければ知らせる", () => {
  const entities = Array.from({ length: 4 }, (_, i) => ({ code: `0${i}`, name: `町${i}` }));
  const frame = buildFrame({
    entities,
    metrics: [
      { alias: "vac", rows: [row("00", "2023", 10), row("01", "2023", 12)], years: [2023] },
      { alias: "dp", rows: [row("00", "2020", -5), row("01", "2020", -7), row("02", "2020", -20), row("03", "2020", -18)], years: [2020] },
    ],
  });
  const coverage = checkCoverage(frame, { required: ["vac_2023"], compareColumn: "dp_2020" });
  assert.deepEqual([coverage.kept, coverage.dropped, coverage.status], [2, 2, "warn"]);
  assert.equal(coverage.keptMedian, -7);
  assert.equal(coverage.droppedMedian, -20);
});

test("指標の年の開きを知らせる", () => {
  const frame = { columns: [{ alias: "ship", year: "2023" }, { alias: "pop", year: "2015" }, { alias: "pop", year: "2020" }] };
  assert.equal(checkYears(frame).status, "ok");
  assert.equal(checkYears({ columns: [{ alias: "ship", year: "2023" }, { alias: "pop", year: "2015" }] }).status, "warn");
});

const threeYears = (changes) => ({
  rows: changes.map(([d1, d2]) => ({ rate_2013: 10, rate_2018: 10 + d1, rate_2023: 10 + d1 + d2 })),
});

test("変化が続かなければ警告するが、計算は止めない", () => {
  const noise = threeYears([[3, -3], [-2, 2], [1, -1], [-3, 3]]);
  const reliability = checkReliability(noise, { alias: "rate", years: ["2013", "2018", "2023"] });
  assert.equal(reliability.status, "warn");
  const summary = summarize({ totals: [], years: { status: "ok" }, coverage: { status: "ok" }, reliability: [reliability] });
  assert.equal(summary.ok, true);
  assert.match(summary.warnings.join(), /順位にしない/);
});

test("変化が続くなら信号として通す", () => {
  const signal = threeYears([[3, 3], [-2, -1], [1, 2], [-3, -2]]);
  assert.equal(checkReliability(signal, { alias: "rate", years: ["2013", "2018", "2023"] }).status, "ok");
});

test("信頼性は 3 時点を要求する", () => {
  assert.throws(() => checkReliability({ rows: [] }, { alias: "rate", years: ["2013", "2023"] }), /3 時点/);
});

test("相関は定数の列で割り算にならない", () => {
  assert.equal(correlation([1, 1, 1], [1, 2, 3]), null);
  assert.ok(Math.abs(correlation([1, 2, 3], [2, 4, 6]) - 1) < 1e-9);
});
