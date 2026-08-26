/**
 * number-audit.mjs のテスト
 *   node --test .claude/scripts/ai-content/__tests__/number-audit.test.mjs
 *
 * ゲートの検証で最も大事なのは「全部 PASS」が
 *   (a) 正しく通した   のか
 *   (b) 何も見ていない のか
 * を区別できることなので、**通すケースと落とすケースを対で置く**。
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildValueContext,
  extractNumericClaims,
  findOutOfRangeNumbers,
  findPrefectureMismatches,
  isAllowedNumber,
  unitMultiplier,
  MIN_AUDITED_VALUE,
} from "../lib/number-audit.mjs";

/** retail-store-count (2021) の実値を縮約したもの (max 86800 / min 4688) */
const VALUES = [
  { areaCode: "13000", areaName: "東京都", value: 86800, rank: 1, unit: "店" },
  { areaCode: "27000", areaName: "大阪府", value: 54764, rank: 2, unit: "店" },
  { areaCode: "23000", areaName: "愛知県", value: 46122, rank: 3, unit: "店" },
  { areaCode: "14000", areaName: "神奈川県", value: 45290, rank: 4, unit: "店" },
  { areaCode: "31000", areaName: "鳥取県", value: 4688, rank: 47, unit: "店" },
];
const CTX = buildValueContext({ values: VALUES, unit: "店", yearCode: "2021" });

test("unitMultiplier: 百万 は 万 より先に判定される", () => {
  assert.equal(unitMultiplier("百万円"), 1e6);
  assert.equal(unitMultiplier("万人"), 1e4);
  assert.equal(unitMultiplier("兆円"), 1e12);
  assert.equal(unitMultiplier("kg"), 1);
  assert.equal(unitMultiplier("kWh"), 1);
  assert.equal(unitMultiplier("店"), 1);
  assert.equal(unitMultiplier(undefined), 1);
});

test("抽出: 1000 未満は対象外 (順位・構成比・倍率と区別できない)", () => {
  assert.deepEqual(
    extractNumericClaims("東京都は1位で、全体の約21%を占め、47位との差は18.5倍です"),
    [],
  );
});

test("抽出: 年表記は数値主張として扱わない", () => {
  assert.deepEqual(extractNumericClaims("2021年度の調査では"), []);
  assert.deepEqual(extractNumericClaims("2021年の値"), []);
  assert.equal(extractNumericClaims("1万年").length, 1, "数量詞付きは年ではない");
});

test("抽出: カンマ区切り・数量詞・小数を実数へ正規化する", () => {
  assert.deepEqual(extractNumericClaims("86,800店")[0].candidates, [86800]);
  assert.deepEqual(extractNumericClaims("746.0万人")[0].candidates, [7460000]);
});

test("抽出: 隣接する数量詞の連なりは 1 グループにまとめ、合算と個別を候補にする", () => {
  const groups = extractNumericClaims("1兆2000億円");
  assert.equal(groups.length, 1, "1 グループに畳む");
  assert.ok(groups[0].candidates.includes(1.2e12), "合算値");
  assert.ok(groups[0].candidates.includes(1e12));
  assert.ok(groups[0].candidates.includes(2e11));
});

test("★回帰: 分母表現 (人口10万対 / 10万人あたり) は数値主張として扱わない", () => {
  // 実測 2026-07-30: treatment-rate-mental-disorder-inpatient の
  // 「全国平均は人口10万対で207.62人」の 10万 を捏造と誤検知した。
  assert.deepEqual(extractNumericClaims("全国平均は人口10万対で207.62人です"), []);
  assert.deepEqual(extractNumericClaims("人口10万人あたりの件数"), []);
  assert.deepEqual(extractNumericClaims("1万人当たりでみると"), []);
});

// --- A. テキストの数値 (区間判定) ---

test("実値をそのまま使った本文は 0 件", () => {
  const text =
    "東京都は86,800店で最も多く、大阪府が54,764店で続きます。" +
    "最も少ない鳥取県は4,688店で、2021年度の平均を下回ります。";
  assert.deepEqual(findOutOfRangeNumbers(text, CTX), []);
});

test("★回帰: 地方ブロック平均 (区間内の部分集合平均) を誤検知しない", () => {
  // 実測 2026-07-30: 旧「許容集合の列挙」方式が retail-store-count の
  // 「近畿の7府県平均は21,415店」を捏造と誤検知した。区間判定で通ること。
  const text =
    "関東の7県平均は35,799店、近畿の7府県平均は21,415店である一方、" +
    "四国の4県平均は8,125店、中国地方の5県平均は11,465店にとどまります。";
  assert.deepEqual(findOutOfRangeNumbers(text, CTX), []);
});

test("区間を超える捏造は検出する (ゲートが実際に落とすことの確認)", () => {
  const bad = findOutOfRangeNumbers("東京都は99,999店で最も多くなっています", CTX);
  assert.equal(bad.length, 1);
  assert.equal(bad[0].value, 99999);
});

test("桁違いの捏造も検出する", () => {
  assert.equal(findOutOfRangeNumbers("大阪府は547,640店です", CTX).length, 1);
});

test("★回帰: 平均との差分 (最小値を下回る値) を誤検知しない", () => {
  // 実測 2026-07-30: bean-sprouts の「全国平均を約2,849g上回り」(= 実値 - 平均) を
  // 区間下限で捏造と誤検知した。差分は必ず min を下回るため下限判定は使わない。
  assert.deepEqual(findOutOfRangeNumbers("全国平均を約2,000店上回ります", CTX), []);
  assert.deepEqual(
    findOutOfRangeNumbers("鳥取県は1,200店です", CTX),
    [],
    "下限は見ない (min 未満の値は許容する)",
  );
});

test("★回帰: 分割解釈で落とさない (およそ12万6千人)", () => {
  // 実測 2026-07-30: elementary-school-children-count の「およそ12万6千人」が
  // `6千`=6000 に分割され min 未満として誤検知された。グループ単位で判定する。
  const ctx = buildValueContext({
    values: [
      { areaName: "東京都", value: 620624 },
      { areaName: "鳥取県", value: 26620 },
    ],
    unit: "人",
  });
  assert.deepEqual(findOutOfRangeNumbers("都道府県平均はおよそ12万6千人です", ctx), []);
});

test("区間を超えても正当な派生値は許容する (全国計・累積和・差・倍率)", () => {
  const sum = VALUES.reduce((a, v) => a + v.value, 0);
  assert.deepEqual(findOutOfRangeNumbers(`全国計は${sum.toLocaleString()}店`, CTX), []);
  const top2 = 86800 + 54764;
  assert.deepEqual(findOutOfRangeNumbers(`上位2県で${top2.toLocaleString()}店`, CTX), []);
  assert.deepEqual(findOutOfRangeNumbers(`差は${(86800 - 4688).toLocaleString()}店`, CTX), []);
});

test("丸め表記は区間内なら通る", () => {
  assert.deepEqual(findOutOfRangeNumbers("東京都は約8.7万店", CTX), []);
});

test("単位スケール違いを吸収する (unit=百万円 の値を兆円で書く)", () => {
  const ctx = buildValueContext({
    values: [{ areaName: "東京都", value: 5802432 }, { areaName: "鳥取県", value: 100000 }],
    unit: "百万円",
    yearCode: "2020",
  });
  assert.deepEqual(findOutOfRangeNumbers("5,802,432百万円", ctx), []);
  assert.deepEqual(findOutOfRangeNumbers("約5.8兆円", ctx), [], "兆円換算も許容");
});

test("実データ未提供なら判定しない (fail-open)", () => {
  assert.deepEqual(findOutOfRangeNumbers("99,999店", null), []);
  assert.equal(buildValueContext({ values: [] }), null);
  assert.equal(buildValueContext(), null);
});

test("同じ表記の重複は 1 件に畳む", () => {
  assert.equal(findOutOfRangeNumbers("99,999店。再掲すると99,999店。", CTX).length, 1);
});

test("MIN_AUDITED_VALUE 境界 (下限未満は抽出しない / 上限超えは検出する)", () => {
  const ctx = buildValueContext({ values: [{ areaName: "東京都", value: 50000 }], unit: "件" });
  assert.deepEqual(findOutOfRangeNumbers("999件", ctx), [], "1000 未満は抽出対象外");
  assert.deepEqual(findOutOfRangeNumbers("1,001件", ctx), [], "上限以下なので通す");
  assert.equal(findOutOfRangeNumbers("500,000件", ctx).length, 1, "上限超えは検出");
  assert.equal(MIN_AUDITED_VALUE, 1000);
});

test("isAllowedNumber は相対誤差で判定する", () => {
  assert.ok(isAllowedNumber(1000, [1010], 0.02));
  assert.ok(!isAllowedNumber(1000, [1100], 0.02));
});

// --- B. 県別解説の構造フィールド (厳密照合) ---

test("県別解説: 実データと一致する items は 0 件", () => {
  const items = VALUES.map((v) => ({
    areaCode: v.areaCode,
    areaName: v.areaName,
    rank: v.rank,
    value: v.value,
    commentary: "…",
  }));
  assert.deepEqual(findPrefectureMismatches(items, CTX), []);
});

test("県別解説: value の誤りを検出する", () => {
  const bad = findPrefectureMismatches(
    [{ areaCode: "13000", areaName: "東京都", rank: 1, value: 86000 }],
    CTX,
  );
  assert.equal(bad.length, 1);
  assert.equal(bad[0].field, "value");
  assert.equal(bad[0].expected, 86800);
});

test("県別解説: rank の誤りを検出する", () => {
  const bad = findPrefectureMismatches(
    [{ areaCode: "27000", areaName: "大阪府", rank: 5, value: 54764 }],
    CTX,
  );
  assert.equal(bad.length, 1);
  assert.equal(bad[0].field, "rank");
});

test("★県別解説: areaCode の取り違え (地図が別県にひも付く) を検出する", () => {
  const bad = findPrefectureMismatches(
    [{ areaCode: "14000", areaName: "東京都", rank: 1, value: 86800 }],
    CTX,
  );
  assert.equal(bad.length, 1);
  assert.equal(bad[0].field, "areaCode");
  assert.equal(bad[0].expected, "13000");
});

test("県別解説: 実データに無い県名を検出する", () => {
  const bad = findPrefectureMismatches([{ areaName: "存在しない県", rank: 1, value: 1 }], CTX);
  assert.equal(bad.length, 1);
  assert.equal(bad[0].field, "unknown-area");
});

test("県別解説: 県名の表記ゆれ (東京 / 東京都) は同一視する", () => {
  assert.deepEqual(
    findPrefectureMismatches([{ areaCode: "13000", areaName: "東京", rank: 1, value: 86800 }], CTX),
    [],
  );
});

test("★回帰: 同名複数行の partition (47×2) で誤検知しない", () => {
  // 実測 2026-07-30: convenience-store-count-commercial の 2025 partition は
  // count 94 で同じ県名が 2 行あり、別系列で上書きされて全 94 件を誤検知した。
  const ctx = buildValueContext({
    values: [
      { areaCode: "13000", areaName: "東京都", value: 7233, rank: 1 },
      { areaCode: "13000", areaName: "東京都", value: 2.3, rank: 51 }, // 別系列
    ],
    unit: "店",
  });
  assert.ok(ctx.hasDuplicateAreas);
  assert.deepEqual(
    findPrefectureMismatches(
      [{ areaCode: "13000", areaName: "東京都", rank: 1, value: 7233 }],
      ctx,
    ),
    [],
    "いずれかの行と全項目一致すれば正しい",
  );
  assert.equal(
    findPrefectureMismatches(
      [{ areaCode: "13000", areaName: "東京都", rank: 1, value: 9999 }],
      ctx,
    ).length,
    1,
    "どの行とも一致しなければ検出する",
  );
});

test("県別解説: ctx なし / items 不正では判定しない", () => {
  assert.deepEqual(findPrefectureMismatches([{ areaName: "東京都", value: 1 }], null), []);
  assert.deepEqual(findPrefectureMismatches(null, CTX), []);
});
