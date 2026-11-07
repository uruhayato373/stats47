import assert from "node:assert/strict";
import { test } from "node:test";

import { checkArticleNumbers, extractNumbers, flattenNumbers } from "../article-numbers-core.mjs";

const texts = (md) => extractNumbers(md).map((n) => n.text);

test("年 4 桁・日付・見出しの番号・小さな数え方・分母を除く", () => {
  const md = "## 1. はじめに\n2024年6月1日時点で、町を4段に分け、2つの要素を見ます。人口1万人あたり1,376人でした。1980〜2023年の推移。";
  assert.deepEqual(texts(md), ["1,376人"]);
});

test("frontmatter は題名・副題・説明だけを読む", () => {
  const md = "---\ntitle: \"764町の分解\"\npublishedAt: 2026-11-07\nslug: a-1\n---\n本文";
  assert.deepEqual(texts(md), ["764町"]);
});

test("リンク先・画像のパスの数字は読まない", () => {
  const md = "![図](data/fig-2.svg) [CSV](https://note.com/n/n5d86476e9c73) を見る。";
  assert.deepEqual(texts(md), []);
});

test("範囲の前の値は後ろの単位を借りる", () => {
  assert.deepEqual(texts("95%の幅は76〜86%です"), ["95%", "76%", "86%"]);
});

test("本文の桁で四捨五入して一致させる", () => {
  const r = checkArticleNumbers("差は3.6倍で、56%でした。", { ratio: 3.64, share: 55.8 });
  assert.equal(r.unmatched.length, 0);
  assert.equal(r.matched[0].paths[0], "ratio");
});

test("% と割合・割を読み替える", () => {
  const r = checkArticleNumbers("31.6%と約8割、1割を除く", { share: 0.316, thick: 81.3, rate: 0.1 });
  assert.deepEqual(r.unmatched, []);
  assert.equal(r.matched.find((m) => m.text === "1割").paths.includes("rate"), true);
});

test("百万円と億円・万円、万人を読み替える", () => {
  const r = checkArticleNumbers("1人あたり0.51億円、6,552万円、773.2万人", { a: 51, b: 65.52, c: 7732000 });
  assert.deepEqual(r.unmatched, []);
});

test("一致しない数値は文脈つきで返し、ratio を出す", () => {
  const r = checkArticleNumbers("上位20町のうち18町が該当します。", { count: 18 });
  assert.equal(r.total, 2);
  assert.equal(r.unmatched[0].text, "20町");
  assert.match(r.unmatched[0].context, /上位20町/);
  assert.equal(r.ratio, 0.5);
});

test("換算でしか当たらない一致は isDirect が false", () => {
  const r = checkArticleNumbers("0.51億円", { x: 50.5 });
  assert.equal(r.matched[0].isDirect, false);
});

test("summary の入れ子をたどって数値を集める", () => {
  assert.deepEqual(flattenNumbers({ a: 1, b: [{ c: 2 }, "x"], d: { e: null } }), [
    { path: "a", value: 1 },
    { path: "b.0.c", value: 2 },
  ]);
});
