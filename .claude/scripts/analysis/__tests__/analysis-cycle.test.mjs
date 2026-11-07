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
const claims = [{ text: "規模が過半", value: "other" }];
const analysis = { stage: "viewpoints", claims, questionTerms: ["規模", "生産性"], finding: "規模と生産性は切り分けられない", viewpoints: completeViewpoints };
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
});

test("framed の工程は問わない", () => {
  assert.deepEqual(run({ analysis: { ...analysis, stage: ANALYSIS_STAGES[0], viewpoints: [] } }), []);
});

// 2026-11-07 の M01: 再計算では数値が合っていたのに、言い過ぎ・審査後の修正・反証の欠落が機械を素通りした
const step = { ...summary, part: 52.8, range: [46.3, 60.5], low: 81.3, lowRange: [76.4, 86.3] };

test("幅が基準をまたぐのに「過半」と言う主張は止める", () => {
  const errors = run({ summary: step, analysis: { ...analysis, claims: [{ text: "上の段でも過半", value: "part", interval: "range", above: 50 }] } });
  assert.ok(errors.some((error) => error.includes("上の段でも過半")));
});

test("幅が基準を超えていれば「過半」と言え、またぐなら半々と言える", () => {
  const claimsOk = [{ text: "下の段は約8割", value: "low", interval: "lowRange", above: 50 }, { text: "上の段はほぼ半々", value: "part", interval: "range", straddles: 50 }];
  assert.deepEqual(run({ summary: step, analysis: { ...analysis, claims: claimsOk } }), []);
});

test("幅は low と high の形でも読む", () => {
  const object = { ...step, range: { low: 85.4, high: 113.9 } };
  assert.deepEqual(run({ summary: object, analysis: { ...analysis, claims: [{ text: "過半", value: "part", interval: "range", above: 50 }] } }), []);
});

test("主張が無い分析と、値が出力に無い主張は止める", () => {
  assert.ok(run({ analysis: { ...analysis, claims: [] } }).includes("結論の主張 (claims) が無い"));
  assert.ok(run({ analysis: { ...analysis, claims: [{ text: "x", value: "missing" }] } }).some((e) => e.includes("missing")));
});

const reviewed = (over = {}) => ({ ...analysis, stage: "reviewed", refutation: { summarySha256: "s".repeat(64), checks: [{ claim: "c", verdict: "holds" }] }, ...over });
const reviewedRun = (over = {}) => run({ analysis: reviewed(), figures: [{ id: "figure:a", reads: "読む" }], article: "規模と生産性 ![図](data/a.svg)", review: `verdict: PASS\narticleSha256: ${"a".repeat(64)}`, hashes: { article: "a".repeat(64), summary: "s".repeat(64) }, ...over });

test("反証と審査が今の本文と出力に結びついていれば通る", () => {
  assert.deepEqual(reviewedRun(), []);
});

test("PASS の後に本文を直すと審査は無効になる", () => {
  assert.ok(reviewedRun({ hashes: { article: "b".repeat(64), summary: "s".repeat(64) } }).includes("審査の後に本文が変わった。審査をやり直す"));
});

test("MAJOR が残る PASS は認めない (H01 の実例)", () => {
  const review = `verdict: PASS\narticleSha256: ${"a".repeat(64)}\n- [MAJOR][title-promise] 副題が幅より強い`;
  assert.ok(reviewedRun({ review }).includes("審査の BLOCK か MAJOR の指摘が残っている"));
  assert.deepEqual(reviewedRun({ review: review.replace("MAJOR", "MINOR") }), []);
});

test("ハッシュの無い PASS は認めない", () => {
  assert.ok(reviewedRun({ review: "verdict: PASS" }).includes("審査の後に本文が変わった。審査をやり直す"));
});

test("反証が無い、古い、崩れたままの分析は下書きへ進まない", () => {
  assert.ok(reviewedRun({ analysis: reviewed({ refutation: undefined }) }).includes("反証の記録が無い"));
  assert.ok(reviewedRun({ hashes: { article: "a".repeat(64), summary: "t".repeat(64) } }).some((e) => e.includes("反証の後に")));
  const broken = reviewed({ refutation: { summarySha256: "s".repeat(64), checks: [{ claim: "全体の3割", verdict: "broken" }] } });
  assert.ok(reviewedRun({ analysis: broken }).some((e) => e.includes("全体の3割")));
});

test("4:5 の型の画像が表示の判定に掛からない名前なら止める (factor-shares.svg の実例)", () => {
  const errors = reviewedRun({ articleFigures: [{ name: "factor-shares.svg", typeImage: true, recognized: false }] });
  assert.ok(errors.some((e) => e.includes("factor-shares.svg")));
});

test("視点には対象の集団と測り方への依存が入っている", () => {
  const ids = layers.map((layer) => layer.id);
  assert.ok(ids.includes("population") && ids.includes("measurement"));
});
