/**
 * 実行: node --test packages/ops/src/ai-content/__tests__/national-average-wording.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { auditRow } from "../audit-ai-content.mjs";
import {
  applyReplacement,
  classifyOccurrence,
  classifyRow,
  replaceReplaceable,
  simpleMeanWording,
} from "../lib/national-average-wording.mjs";

const LABEL = simpleMeanWording(47);
const at = (text) => text.indexOf("全国平均");

test("呼び名は母数つきの単純平均にする", () => {
  assert.equal(simpleMeanWording(47), "47都道府県の単純平均");
  assert.equal(simpleMeanWording(45), "45都道府県の単純平均");
});

test("値の直前・助詞・句読点・「値」「水準」が続く出現は置換できる", () => {
  for (const text of [
    "全国平均を上回る県は11県です。",
    "近畿は全国平均に近い水準です。",
    "全国平均は22,332.89百万円です。",
    "愛知県は全国平均より高く、",
    "全国平均値を下回ります。",
    "全国平均付近に集まっています。",
    "比較の基準は全国平均。",
  ]) {
    assert.equal(classifyOccurrence(text, at(text)), "replaceable", text);
  }
});

test("★指標名の一部になる出現 (「全国平均寿命」「全国平均年収」) は言い換えで崩れるので再生成に回す", () => {
  for (const text of ["全国平均寿命を上回ります。", "全国平均年収は高めです。", "全国平均点を超えます。"]) {
    assert.equal(classifyOccurrence(text, at(text)), "regenerate", text);
  }
});

test("★同じ文に「単純平均」が既にあるときは、置換すると二重になるので再生成に回す", () => {
  const text = "47都道府県の単純平均は0.49で、全国平均を上回る県は6県です。";
  assert.equal(classifyOccurrence(text, at(text)), "regenerate");
});

test("★公表の全国値を指す文と、公表の全国値を持つ行は対象外にする", () => {
  const text = "総務省が公表する全国平均を上回ります。";
  assert.equal(classifyOccurrence(text, at(text)), "official");
  assert.equal(classifyOccurrence("全国平均を上回ります。", 0, { hasPublishedNational: true }), "official");
});

test("replaceReplaceable は置換できる出現だけを置き換え、残りの数を返す", () => {
  const text = "全国平均を上回る県は多く、全国平均寿命も長い。";
  const r = replaceReplaceable(text, LABEL);
  assert.equal(r.text, `${LABEL}を上回る県は多く、全国平均寿命も長い。`);
  assert.deepEqual({ replaced: r.replaced, remaining: r.remaining }, { replaced: 1, remaining: 1 });
});

test("classifyRow は行の最も重い判定を返し、「全国平均」が無い行は none にする", () => {
  assert.equal(classifyRow({ insights: "全国平均を上回ります。" }).verdict, "replaceable");
  assert.equal(classifyRow({ insights: "全国平均を上回ります。", regionalAnalysis: "全国平均寿命が長い。" }).verdict, "regenerate");
  assert.equal(classifyRow({ insights: "全国平均を上回ります。" }, { hasPublishedNational: true }).verdict, "official");
  assert.equal(classifyRow({ insights: "分布を読みます。" }).verdict, "none");
});

test("★JSON 文字列の欄 (faq・prefectureCommentary) も壊さずに置換できる", () => {
  const row = {
    faq: JSON.stringify({ items: [{ question: "全国平均はいくつですか？", answer: "2022年度の全国平均は0.49です。" }] }),
    prefectureCommentary: JSON.stringify({ items: [{ commentary: "全国平均を下回る水準です。" }] }),
  };
  const { row: next, replaced, remaining } = applyReplacement(row, LABEL);
  assert.equal(replaced, 3);
  assert.equal(remaining, 0);
  const faq = JSON.parse(next.faq);
  assert.equal(faq.items[0].question, `${LABEL}はいくつですか？`);
  assert.equal(classifyRow(next).verdict, "none");
  assert.notEqual(next, row);
  assert.match(row.faq, /全国平均/, "元の行は変えない");
});

test("★置換後の行は audit-ai-content の床を通る (置換前に通った行が置換で落ちない)", () => {
  const row = {
    rankingKey: "wording-fixture",
    insights: "全国平均を上回るのは24都道府県で、ほぼ半数ずつに分かれています。分布の偏りを読む手がかりになります。".repeat(4),
    regionalAnalysis: "近畿は全国平均に近い水準で、地方内の差は小さい傾向です。地方ごとの差の広がりを比べます。".repeat(4),
    faq: { items: [{ question: "全国平均はいくつですか？", answer: "収録された観測値の平均を示します。" }] },
    prefectureCommentary: { items: [{ commentary: "観測値と順位を示し、全国平均との距離を読む手がかりにします。".repeat(2) }] },
  };
  const before = auditRow(row);
  const { row: next } = applyReplacement(row, LABEL);
  const after = auditRow(next);
  assert.equal(classifyRow(next).verdict, "none");
  assert.deepEqual(
    after.blockers.map((b) => b.code),
    before.blockers.map((b) => b.code),
    "置換で blocker が増えも減りもしない",
  );
});
