import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { datasetDir } from "../../../../config/datasets.mjs";
import { parseMetric, parseYears, selectMetrics, summarizeRows } from "../analysis-inventory-core.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const readMetric = (key) => parseMetric(readFileSync(join(ROOT, datasetDir("metrics.definitions"), `${key}.ts`), "utf8"), `${key}.ts`);

const metricTs = (body) => `import type { MetricConfig } from "../x";\nexport const m: MetricConfig = {\n${body}\n};\n`;

test("M01 で見落とした純付加価値額は「製造」と市区町村で拾える", () => {
  // 2026-11-07: manufacturing-net-value-added-private (市区町村・2020 年) を見落として M01 を 2 回作り直した
  const metric = readMetric("manufacturing-net-value-added-private");
  const [hit] = selectMetrics([metric], { terms: ["製造"], level: "city" });
  assert.equal(hit?.key, "manufacturing-net-value-added-private");
  assert.deepEqual(hit.matched, ["title"]);
  assert.deepEqual(hit.entities, ["city"]);
  assert.deepEqual({ first: hit.years.first, last: hit.years.last, count: hit.years.count }, { first: 2020, last: 2020, count: 1 });
  assert.equal(hit.isActive, true);
  assert.deepEqual(hit.source, { kind: "estat", statsDataId: "0000010103", displayName: "社会・人口統計体系" });
});

test("--level city は都道府県だけの指標を外す", () => {
  const pref = parseMetric(metricTs(`key: 'a-manufacturing', title: '製造', entities: ['prefecture'], years: { from: 2020, to: 2020 }, isActive: true,`));
  const city = parseMetric(metricTs(`"key": "b-manufacturing", "title": "製造", "entities": ["prefecture", "city"], "years": { "from": 2020, "to": 2020 },`));
  assert.deepEqual(selectMetrics([pref, city], { terms: ["製造"], level: "city" }).map((m) => m.key), ["b-manufacturing"]);
  assert.equal(selectMetrics([pref, city], { terms: ["製造"] }).length, 2);
});

test("入れ子の description (source.config) を指標の説明と取り違えない", () => {
  const m = parseMetric(
    metricTs(`key: 'x', title: '救急', source: { kind: 'external', config: { description: '製造の話' }, displayName: '消防庁' }, entities: ['prefecture'], years: { from: 2024, to: 2024 },`),
  );
  assert.equal(m.description, null);
  assert.equal(m.source.displayName, "消防庁");
  assert.equal(selectMetrics([m], { terms: ["製造"] }).length, 0);
});

test("statsDataId は filter の中 (家計調査) からも読む", () => {
  const m = readMetric("accessories-consumption-expenditure");
  assert.equal(m.source.kind, "kakei-chousa");
  assert.equal(m.source.statsDataId, "0004023605");
});

test("年の配列 (years: [...]) と除外年を読む", () => {
  assert.deepEqual(parseYears(`{ "years": [2005, 2010, 2015] }`), { first: 2005, last: 2015, count: 3, kind: "list" });
  const ranged = parseYears(`{ from: 2010, to: 2016 }`, `[{ years: [2013, 2014, 2015], kind: "x" }]`);
  assert.deepEqual(ranged, { first: 2010, last: 2016, count: 4, kind: "range" });
});

test("年の項目が無い指標は missing として残し、落とさない", () => {
  const m = parseMetric(metricTs(`key: 'no-years', title: '製造', entities: ['city'],`));
  assert.deepEqual(m.years, { first: null, last: null, count: 0, kind: "missing" });
  assert.equal(selectMetrics([m], { terms: ["製造"], level: "city" }).length, 1);
});

test("実ファイル全件で key と年を読める (読み取りの取りこぼしを固定する)", () => {
  const dir = join(ROOT, datasetDir("metrics.definitions"));
  const keys = ["abortion-rate", "ambulance-hospital-arrival-time", "retail-employees", "patent-inventor-count"];
  for (const key of keys) {
    const m = parseMetric(readFileSync(join(dir, `${key}.ts`), "utf8"));
    assert.equal(m.key, key);
    assert.ok(m.years.count > 0, `${key} の年が読めない`);
    assert.ok(m.entities.length > 0, `${key} の粒度が読めない`);
  }
});

test("R2 の行から値のある年と町の数を出す", () => {
  const rows = [
    { areaCode: "01100", yearCode: "2020", value: 1 },
    { areaCode: "01101", yearCode: "2020", value: 2 },
    { areaCode: "01102", yearCode: "2020", value: null },
    { areaCode: "01100", yearCode: "2015000000", value: 3 },
  ];
  assert.deepEqual(summarizeRows(rows), { years: ["2015", "2020"], areasByYear: { 2015: 1, 2020: 2 } });
});
