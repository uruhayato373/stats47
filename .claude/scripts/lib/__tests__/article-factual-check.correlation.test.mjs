/**
 * 本文の相関係数を散布図の接地物と照合する検査 (BLOG-TOPIC-PAIR-PER-CAPITA-01)。
 * 実行: node --test .claude/scripts/lib/__tests__/article-factual-check.correlation.test.mjs
 *
 * 型B の prompt は `*-scatter.source.json` の pearsonR を小数第 2 位で渡すので、本文の値は
 * 同じファイルと一致するはず。発火すること (誤値) と発火しないこと (正しい値・偏相関) の両方を固定する。
 */
import { strict as assert } from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  checkArticleFactual,
  checkCorrelationClaims,
  loadCorrelationFacts,
} from "../article-factual-check.mjs";

const FACT = [{ pearsonR: -0.7134, pointCount: 46 }];
const article = (body) => `---\ntitle: t\n---\n${body}\n`;

test("正しい相関係数 (符号・丸め・表記ゆれ) では発火しない", () => {
  for (const body of [
    "2 つの指標の相関係数は-0.71です。",
    "相関係数は−0.71で、46県のデータで計算しています。",
    "相関係数はマイナス0.71です。",
    "相関係数が約-0.7と強めです。",
    "r=-0.71 の負の相関です。",
  ]) {
    const r = checkCorrelationClaims(article(body), FACT);
    assert.deepEqual(r.blockers, [], body);
    assert.deepEqual(r.warnings, [], body);
  }
});

// 段階導入で warning (公開記事に散布図に無い別の相関を語る文があるため。照合関数の冒頭コメント参照)
test("誤った相関係数・符号の落ちた相関係数は CORRELATION_MISMATCH", () => {
  for (const body of ["相関係数は-0.81です。", "相関係数は0.71です。", "相関係数は−0.72です。"]) {
    const r = checkCorrelationClaims(article(body), FACT);
    assert.deepEqual(r.blockers, [], body);
    assert.equal(r.warnings.length, 1, body);
    assert.match(r.warnings[0], /CORRELATION_MISMATCH/);
  }
});

test("偏相関係数は照合しない (人口統制の値は別物)", () => {
  const r = checkCorrelationClaims(article("人口の影響を除いた偏相関係数は0.30です。"), FACT);
  assert.deepEqual(r.blockers, []);
  assert.deepEqual(r.warnings, []);
});

test("source.json の偏相関 (partialRPopulation) と一致する r= は発火しない", () => {
  const facts = [{ pearsonR: 0.926, partialR: 0.7131, pointCount: 47 }];
  const ok = checkCorrelationClaims(article("人口の影響を除いた偏相関係数を計算すると、r=0.713 でした。"), facts);
  assert.deepEqual(ok.warnings, []);
  // 偏相関が無い散布図では同じ文が発火する (既知の値として足したことの確認)
  const none = checkCorrelationClaims(article("人口の影響を除いた偏相関係数を計算すると、r=0.713 でした。"), [{ pearsonR: 0.926, partialR: null, pointCount: 47 }]);
  assert.equal(none.warnings.length, 1);
  assert.match(none.warnings[0], /CORRELATION_MISMATCH/);
});

test("loadCorrelationFacts は partialRPopulation を partialR として読む", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "corr-partial-"));
  fs.writeFileSync(path.join(dir, "a-scatter.source.json"), JSON.stringify({ pearsonR: 0.88, partialRPopulation: 0.7954 }));
  fs.writeFileSync(path.join(dir, "b-scatter.source.json"), JSON.stringify({ pearsonR: 0.5 }));
  const facts = loadCorrelationFacts(dir).sort((x, y) => x.file.localeCompare(y.file));
  assert.equal(facts[0].partialR, 0.7954);
  assert.equal(facts[1].partialR, null);
});

test("相関の文の県数が散布図の点数と違えば warning (47 は許容)", () => {
  const wrong = checkCorrelationClaims(article("44県で計算した相関係数は-0.71です。"), FACT);
  assert.deepEqual(wrong.blockers, []);
  assert.equal(wrong.warnings.length, 1);
  assert.match(wrong.warnings[0], /CORRELATION_COUNT_MISMATCH/);
  const ok = checkCorrelationClaims(article("47都道府県のうち46県で計算した相関係数は-0.71です。"), FACT);
  assert.deepEqual(ok.warnings, []);
});

test("照合先が無いのに相関係数を書けば warning", () => {
  const r = checkCorrelationClaims(article("相関係数は0.5です。"), []);
  assert.deepEqual(r.blockers, []);
  assert.match(r.warnings[0], /CORRELATION_NO_TRUTH/);
});

test("checkArticleFactual が data/ の散布図接地物を読んで照合する (配線)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "corr-factual-"));
  try {
    fs.writeFileSync(
      path.join(dir, "a--b-scatter.source.json"),
      JSON.stringify({ kind: "correlation", pearsonR: -0.7134 }),
    );
    fs.writeFileSync(
      path.join(dir, "a--b-scatter.json"),
      JSON.stringify({ points: Array.from({ length: 46 }, (_, i) => ({ x: i, y: i, label: `p${i}` })) }),
    );
    assert.deepEqual(loadCorrelationFacts(dir), [
      { file: "a--b-scatter.source.json", pearsonR: -0.7134, partialR: null, pointCount: 46 },
    ]);
    const correlationIssues = (r) => r.warnings.filter((w) => w.startsWith("CORRELATION"));
    assert.deepEqual(correlationIssues(checkArticleFactual(article("相関係数は-0.71です。"), dir)), []);
    const bad = correlationIssues(checkArticleFactual(article("相関係数は-0.91です。"), dir));
    assert.equal(bad.length, 1);
    assert.match(bad[0], /CORRELATION_MISMATCH/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
