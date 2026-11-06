import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { analysisCycleErrors, ANALYSIS_STAGES } from "../analysis-cycle-core.mjs";

const ROOT = join(import.meta.dirname, "../../../..");
const { layers } = JSON.parse(readFileSync(join(ROOT, "data/content/analysis-viewpoints.json"), "utf8"));
const issue = { question: "製造業が強い地域の強さは、規模か生産性か" };

// 2026-11-05 の M01: 問いを言い換え、2 要素で分解を止めたまま、機械の検査と審査を PASS した版
const oldAnalysis = {
  stage: "draft",
  questionTerms: ["規模", "生産性"],
  finding: "人口あたり出荷額の差の 63.1% は 1 事業所あたり出荷額、36.9% は事業所の数で説明できる。",
  viewpoints: [],
};
const oldSummary = { shareDensity: 0.369, shareSize: 0.631 };
const oldArticle = "差の6割は1つの工場の大きさで説明できる ![図](data/a.svg)";

const completeViewpoints = layers.map((layer) => ({ layer: layer.id, status: "done", result: "結果", evidence: layer.id === "decomposition" ? "shares" : layer.id === "robustness" ? "robustness" : "other" }));
const summary = { shares: { a: 31.6, b: 19.8, c: 17.1, d: 20.9, e: 10.7 }, robustness: [{}, {}], other: 1 };
const analysis = { stage: "viewpoints", questionTerms: ["規模", "生産性"], finding: "規模と生産性は切り分けられない", viewpoints: completeViewpoints };
const run = (over) => analysisCycleErrors({ analysis, issue, layers, summary, figures: [], ...over });

test("古い M01 は問いの語が結論に無く、視点も無いので書く前に止まる", () => {
  const errors = analysisCycleErrors({ analysis: oldAnalysis, issue, layers, summary: oldSummary, figures: [], article: oldArticle });
  assert.ok(errors.includes("結論が問いの語で答えていない: 規模"));
  assert.ok(errors.includes("結論が問いの語で答えていない: 生産性"));
  assert.ok(errors.includes("記事が問いの語で答えていない: 規模"));
  assert.ok(errors.some((error) => error.includes("「分解」")));
  assert.ok(errors.some((error) => error.includes("「基準比較」")));
});

test("視点が揃えば通る", () => {
  assert.deepEqual(run({}), []);
});

test("根拠が分析の出力に無い視点は止める (書いただけでは通らない)", () => {
  const errors = run({ summary: { ...summary, other: undefined } });
  assert.ok(errors.some((error) => error.includes("根拠が分析の出力に無い: other")));
});

test("分解の内訳が 100% にならなければ止める", () => {
  const errors = run({ summary: { ...summary, shares: { a: 36.9, b: 33 } } });
  assert.ok(errors.some((error) => error.includes("分解の内訳の合計")));
});

test("頑健性は 2 通り以上で比べる", () => {
  assert.ok(run({ summary: { ...summary, robustness: [{}] } }).some((error) => error.includes("2 通り以上")));
});

test("対象外は理由があれば通り、無ければ止める", () => {
  const na = (reason) => ({ ...analysis, viewpoints: completeViewpoints.map((row) => (row.layer === "baseline" ? { layer: row.layer, status: "na", ...(reason ? { reason } : {}) } : row)) });
  assert.deepEqual(run({ analysis: na("比べる全体が無い") }), []);
  assert.ok(run({ analysis: na() }).some((error) => error.includes("対象外の理由")));
});

test("問いの語は台帳の問いにある語だけ", () => {
  const errors = run({ analysis: { ...analysis, questionTerms: ["大きさ"], finding: "大きさ" } });
  assert.ok(errors.includes("問いの語が台帳の問いに無い: 大きさ"));
});

test("図の読み方と記事の図の枚数を工程に応じて見る", () => {
  const figures = [{ id: "figure:a" }];
  const article = "規模と生産性";
  const errors = run({ analysis: { ...analysis, stage: "draft" }, figures, article });
  assert.ok(errors.includes("図の読み方 (reads) が無い: figure:a"));
  assert.ok(errors.includes("図の台帳 1 枚に対し、記事の図は 0 枚"));
});

test("審査の工程は PASS を必要とする", () => {
  const stage = { ...analysis, stage: "reviewed" };
  const article = "規模と生産性 ![図](data/a.svg)";
  const figures = [{ id: "figure:a", reads: "読む" }];
  assert.ok(run({ analysis: stage, article, figures, review: "verdict: REVISE" }).includes("審査が PASS していない"));
  assert.deepEqual(run({ analysis: stage, article, figures, review: "verdict: PASS" }), []);
});

test("framed の工程は問わない", () => {
  assert.deepEqual(run({ analysis: { ...analysis, stage: ANALYSIS_STAGES[0], viewpoints: [] } }), []);
});
