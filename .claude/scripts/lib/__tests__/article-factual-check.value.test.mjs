/**
 * checkValueClaims の standalone テスト (vitest 基盤外のため node 直接実行)。
 * 実行: node .claude/scripts/lib/__tests__/article-factual-check.value.test.mjs
 */
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  buildGroundTruth,
  checkValueClaims,
  parseJapaneseNumeral,
} from "../article-factual-check.mjs";

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

// ============================================================================
// 複合数値表記 (2026-07-31)
//
// 日本語散文は「4万5,897円」のようにスケールを跨いだ数値表記を普通に使う。
// 旧実装は末尾の「5,897」だけを拾い、data の 45,897 と「7.8倍 乖離」と誤検出していた。
// 公開済み 388 記事の実測では検出 172 件の相当数がこれで、
// accommodation-expenditure-ranking 単体では 9 件 → 0 件になった (記事は実際に「5万222円」と表記)。
//
// 取りこぼしは誤検出だけでなく検出漏れも生む (誤った「4万5,897円」を別の数として比較する)。
// ============================================================================

test("複合表記 4万5,897円 が data 45897 と一致 → WARN なし (旧実装は 7.8倍乖離と誤検出)", () => {
  const gt = { 神奈川: [{ value: 45897, unit: "円", label: "宿泊費" }] };
  const md = "神奈川県の宿泊費は4万5,897円だった。";
  const w = checkValueClaims(md, gt);
  assert.strictEqual(w.length, 0, `想定 0 件, 実際 ${w.length}: ${w.join("|")}`);
});

test("複合表記 5万222円 が data 50222 と一致 → WARN なし (実記事の表記)", () => {
  const gt = { 埼玉: [{ value: 50222, unit: "円", label: "宿泊費" }] };
  const md = "埼玉県は5万222円で、全国的にも高い水準にある。";
  assert.strictEqual(checkValueClaims(md, gt).length, 0);
});

test("3 段の複合表記 1億2,000万円 → 120000000 として解釈", () => {
  const gt = { 東京: [{ value: 120000000, unit: "円", label: "予算" }] };
  const md = "東京都の予算は1億2,000万円である。";
  assert.strictEqual(checkValueClaims(md, gt).length, 0);
});

test("★複合表記でも本当に誤っていれば検出する (4万5,897円 vs data 5,897円)", () => {
  const gt = { 神奈川: [{ value: 5897, unit: "円", label: "宿泊費" }] };
  const md = "神奈川県の宿泊費は4万5,897円だった。";
  const w = checkValueClaims(md, gt);
  assert.strictEqual(w.length, 1, `想定 1 件, 実際 ${w.length}: ${w.join("|")}`);
  assert.match(w[0], /VALUE_MISMATCH/);
});

test("単一スケール表記は従来どおり (4.6万円 vs data 46000)", () => {
  const gt = { 京都: [{ value: 46000, unit: "円", label: "宿泊費" }] };
  assert.strictEqual(checkValueClaims("京都府は4.6万円。", gt).length, 0);
});

test("parseJapaneseNumeral: 各表記を正しく解釈する", () => {
  const cases = [
    ["12,345", 12345],
    ["4万5,897", 45897],
    ["5万222", 50222],
    ["1万5千", 15000],
    ["2.5万", 25000],
    ["1億2,000万", 120000000],
    ["58兆", 58e12],
  ];
  for (const [input, expected] of cases) {
    assert.strictEqual(
      parseJapaneseNumeral(input),
      expected,
      `${input} → 想定 ${expected}, 実際 ${parseJapaneseNumeral(input)}`,
    );
  }
  assert.strictEqual(parseJapaneseNumeral("なし"), null);
});

// ============================================================================
// 単位スケールの長語優先 (2026-07-31)
// 旧実装は JA_SCALE の宣言順で includes していたため "百万円" が 万(1e4) にマッチし、
// data 側だけ 100 分の 1 に評価されて「100.0倍 乖離」と誤検出していた (cc-estat 系で実発生)。
// ============================================================================

test("百万円 単位の data と本文が一致 → WARN なし (旧実装は 100倍乖離と誤検出)", () => {
  const gt = { 愛知: [{ value: 58021789, unit: "百万円", label: "製造品出荷額等" }] };
  const md = "愛知県の製造品出荷額等は58,021,789百万円である。";
  const w = checkValueClaims(md, gt);
  assert.strictEqual(w.length, 0, `想定 0 件, 実際 ${w.length}: ${w.join("|")}`);
});

test("百万円 data を兆円で言い換えても一致 (58,021,789百万円 ≒ 58兆円)", () => {
  const gt = { 愛知: [{ value: 58021789, unit: "百万円", label: "製造品出荷額等" }] };
  assert.strictEqual(checkValueClaims("愛知県は58兆円。", gt).length, 0);
});

// ============================================================================
// 別指標の言及 (2026-07-31)
// 記事は比較のため ground truth を持たない他指標を引くことがある。検証不能なものを
// 「乖離」と報告しない。ただし指標名を伴わない通常の文では従来どおり検出する。
// ============================================================================

const gtTea = { 静岡: [{ value: 597, unit: "円", label: "紅茶消費支出額" }] };

test("ground truth の無い別指標 (緑茶) の値は skip", () => {
  const md = "ちなみに緑茶消費支出額の全国1位は静岡県で7,664円だった。";
  const w = checkValueClaims(md, gtTea);
  assert.strictEqual(w.length, 0, `想定 0 件, 実際 ${w.length}: ${w.join("|")}`);
});

test("★指標名を伴わない文では従来どおり検出する (skip が効きすぎない)", () => {
  const md = "静岡県は7,664円で全国1位だった。";
  const w = checkValueClaims(md, gtTea);
  assert.strictEqual(w.length, 1, `想定 1 件, 実際 ${w.length}: ${w.join("|")}`);
});

test("記事自身の指標名が付いていれば検出する", () => {
  const md = "紅茶消費支出額をみると静岡県は7,664円だった。";
  assert.strictEqual(checkValueClaims(md, gtTea).length, 1);
});

test("列挙の 2 つ目以降でも別指標判定が効く (文単位の窓)", () => {
  const gt = {
    兵庫: [{ value: 1288, unit: "円", label: "紅茶消費支出額" }],
    滋賀: [{ value: 1130, unit: "円", label: "紅茶消費支出額" }],
  };
  const md = "兵庫県はコーヒー消費支出額でも1位で10,098円、滋賀県も2位で9,799円だった。";
  const w = checkValueClaims(md, gt);
  assert.strictEqual(w.length, 0, `想定 0 件, 実際 ${w.length}: ${w.join("|")}`);
});

// ============================================================================
// 散布図の索引 (2026-07-31)
// points[] は pref/value フィールドを持たないため ground truth に 1 件も入らず、
// 本文が軸の値を引用すると「別指標と乖離」と誤検出されていた。
// ============================================================================

test("散布図の 2 軸が単位付きで索引される", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gt-"));
  fs.writeFileSync(
    path.join(dir, "income-scatter.json"),
    JSON.stringify({
      xLabel: "1世帯あたり年間収入",
      xUnit: "千円",
      yLabel: "紅茶消費支出額",
      yUnit: "円",
      points: [{ x: 6220, y: 1780, label: "神奈川県" }],
    }),
  );
  const gt = buildGroundTruth(dir);
  fs.rmSync(dir, { recursive: true, force: true });

  const facts = gt["神奈川"] || [];
  assert.ok(
    facts.some((f) => f.value === 6220 && f.unit === "千円"),
    `x 軸 (収入) が索引されていない: ${JSON.stringify(facts)}`,
  );
  assert.ok(
    facts.some((f) => f.value === 1780 && f.unit === "円"),
    `y 軸 (紅茶) が索引されていない: ${JSON.stringify(facts)}`,
  );
});

test("散布図の軸の値を本文で引用しても誤検出しない", () => {
  const gt = {
    神奈川: [
      { value: 6220, unit: "千円", label: "1世帯あたり年間収入" },
      { value: 1780, unit: "円", label: "紅茶消費支出額" },
    ],
  };
  const md = "神奈川県の1世帯あたり年間収入は6,220千円である。";
  assert.strictEqual(checkValueClaims(md, gt).length, 0);
});

console.log(`\n[value-claims test] pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
