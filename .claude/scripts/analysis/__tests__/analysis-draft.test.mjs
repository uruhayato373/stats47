/**
 * 分析から記事の下書きを作る部品が守る意図:
 *   - 図の数値は結果の JSON からだけ来る。定義した項目が無いときは埋めずに止める
 *   - 出典の指標は分析の spec から導く (台帳に写しを持たない)
 *   - 足りない台帳は図を書き始める前に全部分かる
 */
import assert from "node:assert/strict";
import test from "node:test";

import { buildChart, buildChartData, buildChartSource, buildMaterials, draftInputProblems, fillMeta } from "../analysis-draft-core.mjs";

const result = {
  towns: 1052,
  groups: [
    { label: "人口増", towns: 212, medianChange: -1 },
    { label: "人口減", towns: 840, medianChange: 2.82 },
  ],
};
const figure = {
  id: "figure:X01-a",
  title: "題",
  scope: "municipality",
  template: "grouped-bar",
  chart: {
    name: "a",
    meta: "2023年・{towns}市区町村",
    source: "調査",
    rows: "groups",
    category: "label",
    count: "towns",
    unit: "ポイント",
    transform: "区分ごとの中央値",
    series: [{ label: "変化", field: "medianChange" }],
    displaySources: [{ label: "調査", surveyId: "census" }],
  },
};

test("見出しの差し込みは結果の値で埋め、無ければ止める", () => {
  assert.equal(fillMeta("{towns}市区町村", result), "1,052市区町村");
  assert.throws(() => fillMeta("{missing}", result), /missing/);
});

test("図の値は結果の行の順のまま運ぶ", () => {
  const chart = buildChart(figure, result);
  assert.deepEqual(chart.groups, ["人口増", "人口減"]);
  assert.deepEqual(chart.series, [{ label: "変化", values: [-1, 2.82] }]);
  assert.equal(chart.meta, "2023年・1,052市区町村");
  assert.deepEqual(buildChartData(figure, chart, result).data[1], { label: "人口減", towns: 840, unit: "ポイント", 変化: 2.82 });
});

test("定義した項目が結果に無い図は作らない (0 や空で埋めない)", () => {
  const broken = { groups: [{ label: "人口増", medianChange: null }] };
  assert.throws(() => buildChart(figure, { ...result, ...broken }), /medianChange が数値でない/);
  assert.throws(() => buildChart({ ...figure, chart: { ...figure.chart, rows: "none" } }, result), /行 none が無い/);
});

test("出典の指標は spec から導き、市区町村の図は地域の範囲を持つ", () => {
  const source = buildChartSource({ figure, spec: { metrics: [{ key: "a" }, { key: "b" }] }, generatedBy: "x.ts" });
  assert.equal(source.source, "r2:app/stats/a/cities.json + r2:app/stats/b/cities.json");
  assert.equal(source.areaScope.level, "municipality");
  const prefecture = buildChartSource({ figure: { ...figure, scope: "prefecture" }, spec: { metrics: [{ key: "a" }] }, generatedBy: "x.ts" });
  assert.equal(prefecture.source, "r2:app/stats/a/values.json");
  assert.equal(prefecture.areaScope, undefined);
});

test("足りない台帳は全部挙げ、未対応の型も止める", () => {
  const problems = draftInputProblems({
    analysis: { id: "analysis:X" },
    figures: [{ id: "figure:X", template: "scatter" }],
    supportedTemplates: ["grouped-bar"],
  });
  assert.equal(problems.length, 3);
  assert.deepEqual(draftInputProblems({ analysis: { id: "a", article: {} }, figures: [figure], supportedTemplates: ["grouped-bar"] }), []);
});

test("書き手への材料に結論と注意点が全部入る", () => {
  const text = buildMaterials({ analysis: { question: "問い", finding: "結論", caveats: ["注意1", "注意2"] } });
  for (const part of ["問い", "結論", "注意1", "注意2"]) assert.ok(text.includes(part));
});

test("折れ線は系列を結果からそのまま作り、欠けた点は止める", () => {
  const line = { id: "figure:line", template: "line", title: "題", chart: { rows: "trend", meta: "{towns}町", source: "出典", decimals: 1 } };
  const trend = [{ label: "増", points: [{ x: "2013年", value: 1 }, { x: "2023年", value: 2 }] }];
  assert.deepEqual(buildChart(line, { towns: 3, trend }).series, trend);
  assert.throws(() => buildChart(line, { towns: 3, trend: [{ label: "増", points: [{ x: "2013年", value: null }] }] }), /点が足りない/);
});

test("散布図は市区町村の点として描き、相関と点数を出典へ残す", () => {
  const scatter = { id: "figure:s", template: "scatter", title: "題", scope: "municipality", chart: { rows: "points", meta: "説明", source: "出典", xLabel: "x", yLabel: "y", correlationField: "r", transform: "t", displaySources: [] } };
  const result = { r: -0.7, points: [{ code: "1", name: "a", x: 1, y: 2 }, { code: "2", name: "b", x: 2, y: 3 }] };
  const built = buildChart(scatter, result);
  assert.equal(built.level, "municipality");
  assert.deepEqual(built.labelNames, []);
  assert.equal(buildChartData(scatter, built, result).chartType, "scatter");
  const source = buildChartSource({ figure: scatter, spec: { metrics: [{ key: "a" }] }, generatedBy: "x", result });
  assert.equal(source.expectedPointCount, 2);
  assert.equal(source.pearsonR, -0.7);
});
