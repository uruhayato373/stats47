/**
 * checkValueClaims の standalone テスト (vitest 基盤外のため node 直接実行)。
 * 実行: node .claude/scripts/lib/__tests__/article-factual-check.value.test.mjs
 */
import assert from "node:assert";

import { checkValueClaims } from "../article-factual-check.mjs";

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

// gt: prefName(正規化済) → [{rank, value, unit, label}]
const gtSeika = {
  愛知: [{ value: 58, unit: "兆円", label: "製造品出荷額" }],
  沖縄: [{ value: 0.5, unit: "兆円", label: "製造品出荷額" }],
};

test("単位スケール一致 (58兆円 prose vs value 58 unit 兆円) → WARN なし", () => {
  const md = "愛知県の製造品出荷額は58兆円で全国1位。";
  const w = checkValueClaims(md, gtSeika);
  assert.strictEqual(w.length, 0, `想定 0 件, 実際 ${w.length}: ${w.join("|")}`);
});

test("gross mismatch (発電量 42百万MWh vs data 5.7 百万MWh, 7倍) → WARN", () => {
  const gt = { 東京: [{ value: 5.7, unit: "百万MWh", label: "発電量" }] };
  const md = "東京都の発電量は42百万MWhに達する。";
  const w = checkValueClaims(md, gt);
  assert.strictEqual(w.length, 1, `想定 1 件, 実際 ${w.length}`);
  assert.match(w[0], /VALUE_MISMATCH/);
});

test("単位次元が違う (人 claim vs 円 data のみ) → skip (WARN なし)", () => {
  const gt = { 愛知: [{ value: 58, unit: "兆円", label: "出荷額" }] };
  const md = "愛知県の人口は7500000人を超える。";
  const w = checkValueClaims(md, gt);
  assert.strictEqual(w.length, 0, `想定 0 件 (次元不一致 skip), 実際 ${w.length}: ${w.join("|")}`);
});

test("単位なし裸の数値・年号 → 対象外 (WARN なし)", () => {
  const gt = { 愛知: [{ value: 58, unit: "兆円", label: "出荷額" }] };
  const md = "2023年の調査では愛知県が47都道府県中1位だった。";
  const w = checkValueClaims(md, gt);
  assert.strictEqual(w.length, 0, `想定 0 件, 実際 ${w.length}: ${w.join("|")}`);
});

test("±5% 以内は一致扱い (58兆 vs data 57.5兆) → WARN なし", () => {
  const gt = { 愛知: [{ value: 57.5, unit: "兆円", label: "出荷額" }] };
  const md = "愛知県は58兆円。";
  const w = checkValueClaims(md, gt);
  assert.strictEqual(w.length, 0, `想定 0 件, 実際 ${w.length}: ${w.join("|")}`);
});

test("比較可能 data が無い pref → skip (WARN なし)", () => {
  const gt = { 大阪: [{ value: 10, unit: "兆円", label: "出荷額" }] };
  const md = "愛知県は999兆円。"; // 愛知 は gt に無い
  const w = checkValueClaims(md, gtMissing(md));
  assert.strictEqual(w.length, 0);
});
function gtMissing() {
  return { 大阪: [{ value: 10, unit: "兆円", label: "出荷額" }] };
}

test("% 単位の gross mismatch (普及率 80% vs data 5.9%) → WARN", () => {
  const gt = { 高知: [{ value: 5.9, unit: "%", label: "太陽光普及率" }] };
  const md = "高知県の太陽光普及率は80%に達する。";
  const w = checkValueClaims(md, gt);
  assert.strictEqual(w.length, 1, `想定 1 件, 実際 ${w.length}: ${w.join("|")}`);
});

console.log(`\n[value-claims test] pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
