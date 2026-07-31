/**
 * paren-number-lint のテスト (vitest 基盤外のため node 直接実行)。
 * 実行: node .claude/scripts/lib/__tests__/paren-number-lint.test.mjs
 *
 * ★検出条件は規約の原文「都道府県名の直後に括弧で値・順位を入れてはならない」に忠実であること。
 * 「括弧に数字があれば違反」と広げると公開済み記事の 97.6% が該当し、単位・対象・出典の
 * 正当な注記まで巻き込む (2026-07-31 実測)。この境界をテストで固定する。
 */
import assert from "node:assert";

import { lintParenNumbers } from "../paren-number-lint.mjs";

let pass = 0;
let fail = 0;
function test(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.error(`  ✗ ${name}\n    ${e.message}`);
  }
}
const hits = (md) => lintParenNumbers(md).hits.length;

// --- 検出する (規約の NG 例そのもの) ---

test("県名の直後に値 → 検出", () => {
  assert.strictEqual(hits("愛知県（746.0万人）が4位となっている。"), 1);
});

test("県名の直後に値と順位 → 検出", () => {
  assert.strictEqual(hits("石川県（2.5人、31位）は全国平均を下回ります。"), 1);
});

test("半角括弧でも検出", () => {
  assert.strictEqual(hits("千葉県 (3,427ml) が上位に入ります。"), 1);
});

test("括弧付き県名を連続させるのも検出 (2 件)", () => {
  assert.strictEqual(hits("福井県（73.9万人）や山梨県（79.1万人）は同水準です。"), 2);
});

test("blocker として報告される", () => {
  const r = lintParenNumbers("愛知県（746.0万人）が4位。");
  assert.strictEqual(r.blockers.length, 1);
  assert.match(r.blockers[0], /paren-number/);
});

// --- 検出しない (正当な書き方・実記事で確認した誤検出源) ---

test("★単位の注記は対象外 (人口10万人当たり)", () => {
  assert.strictEqual(hits("火災件数（人口10万人当たり）を比較します。"), 0);
});

test("★対象の限定は対象外 (2人以上 / 10歳以上)", () => {
  assert.strictEqual(hits("家計調査（2人以上の世帯）の結果です。"), 0);
  assert.strictEqual(hits("行動者率（10歳以上）を用います。"), 0);
});

test("★年度表記は対象外 (西暦・和暦)", () => {
  assert.strictEqual(hits("愛知県の出荷額（2020年度）は増加しました。"), 0);
  assert.strictEqual(hits("推計値（令和5年）を参照します。"), 0);
});

test("★出典・注記は対象外", () => {
  assert.strictEqual(hits("愛知県が1位です（出典: 経済センサス 2021年）。"), 0);
  assert.strictEqual(hits("補正しています（※ 47都道府県中）。"), 0);
});

test("県名の直後でも数字が無ければ対象外", () => {
  assert.strictEqual(hits("愛知県（東海地方）は製造業が盛んです。"), 0);
});

test("規約の OK 例は素通りする", () => {
  assert.strictEqual(hits("愛知県は4位で、中部地方の中核を担っている。"), 0);
  assert.strictEqual(hits("石川県は31位で全国平均をやや下回る。"), 0);
});

test("markdown リンクの URL は括弧ではない", () => {
  assert.strictEqual(hits("[愛知県](/areas/23000)は4位です。"), 0);
});

test("コードブロック内は対象外", () => {
  assert.strictEqual(hits("```\n愛知県（746.0万人）\n```\n"), 0);
});

test("frontmatter は対象外", () => {
  assert.strictEqual(hits("---\ntitle: 愛知県（746.0万人）\n---\n本文です。"), 0);
});

test("違反が無ければ blockers は空", () => {
  assert.deepStrictEqual(lintParenNumbers("愛知県は4位です。").blockers, []);
});

console.log(`\n[paren-number-lint test] pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
