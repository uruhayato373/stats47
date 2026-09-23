import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCautionLine,
  buildHook,
  computeFittedLineHighlights,
  evaluateCategoryRangeGate,
  evaluateTautology,
  joinByPrefecture,
  MAX_POPULATION_ADJUSTED_R,
  MIN_POPULATION_ADJUSTED_R,
  REQUIRED_PREFECTURE_COUNT,
  stemRankingKey,
  stemTitle,
  yearGapExceedsLimit,
  type CandidatePairMeta,
} from "../lib/correlation-carousel-core.ts";
import { calculatePartialR, calculatePearsonR } from "../../../../packages/correlation/src/utils/calculate-pearson.ts";

const shijimiPair: CandidatePairMeta = {
  keyX: "freshwater-clam-consumption-expenditure",
  keyY: "freshwater-clam-consumption-quantity",
  titleX: "しじみ消費支出額",
  titleY: "しじみ消費量",
  unitX: "円",
  unitY: "g",
  normalizationBasisX: null,
  normalizationBasisY: null,
};

test("しじみ消費支出額×しじみ消費量はキー stem 一致でタウトロジー判定される", () => {
  assert.equal(stemRankingKey(shijimiPair.keyX), stemRankingKey(shijimiPair.keyY));
  const verdict = evaluateTautology(shijimiPair);
  assert.equal(verdict.tautological, true);
  assert.equal(verdict.reason, "key-stem");
});

test("タイトルの包含関係だけで stem が異なるペアも検出する", () => {
  const pair: CandidatePairMeta = {
    keyX: "paved-road-municipal-length",
    keyY: "paved-road-total-length",
    titleX: "舗装道路実延長（市町村道）",
    titleY: "舗装道路実延長",
    unitX: "km",
    unitY: "km",
    normalizationBasisX: null,
    normalizationBasisY: null,
  };
  const verdict = evaluateTautology(pair);
  assert.equal(verdict.tautological, true);
  assert.equal(verdict.reason, "title-contains");
});

test("正規化されていない実数・総額のペアは raw-unnormalized で除外される", () => {
  const pair: CandidatePairMeta = {
    keyX: "investment-contributions-prefecture",
    keyY: "urban-planning-expenses-prefecture",
    titleX: "投資及び出資金",
    titleY: "都市計画費",
    unitX: "千円",
    unitY: "千円",
    normalizationBasisX: null,
    normalizationBasisY: null,
  };
  const verdict = evaluateTautology(pair);
  assert.equal(verdict.tautological, true);
  assert.equal(verdict.reason, "raw-unnormalized-x");
});

test("末尾の丸括弧注記だけが違う同一現象ペアは title-parenthetical-variant で検出する", () => {
  const pair: CandidatePairMeta = {
    keyX: "wind-power-capacity",
    keyY: "wind-power-turbine-count",
    titleX: "風力発電導入量（設備容量）",
    titleY: "風力発電導入量（設置基数）",
    unitX: "kW",
    unitY: "基",
    normalizationBasisX: null,
    normalizationBasisY: null,
  };
  const verdict = evaluateTautology(pair);
  assert.equal(verdict.tautological, true);
  assert.equal(verdict.reason, "title-parenthetical-variant");
});

test("両側が他指標からの算術導出 (calculated) の場合は both-calculated-derivative で除外する", () => {
  const pair: CandidatePairMeta = {
    keyX: "disposable-income-after-rent",
    keyY: "real-disposable-income",
    titleX: "家賃差引の参考額（月額）",
    titleY: "実質可処分所得（物価補正後）",
    unitX: "円",
    unitY: "円",
    normalizationBasisX: null,
    normalizationBasisY: null,
    isCalculatedX: true,
    isCalculatedY: true,
  };
  const verdict = evaluateTautology(pair);
  assert.equal(verdict.tautological, true);
  assert.equal(verdict.reason, "both-calculated-derivative");
});

test("片側だけが calculated の場合は both-calculated-derivative を発火しない", () => {
  const pair: CandidatePairMeta = {
    keyX: "actual-income-worker-households-per-month",
    keyY: "real-disposable-income",
    titleX: "実収入",
    titleY: "実質可処分所得（物価補正後）",
    unitX: "千円",
    unitY: "円",
    normalizationBasisX: null,
    normalizationBasisY: null,
    isCalculatedX: false,
    isCalculatedY: true,
  };
  const verdict = evaluateTautology(pair);
  assert.notEqual(verdict.reason, "both-calculated-derivative");
});

test("正当な指標ペア（stem不一致・タイトル非包含・正規化済み単位）はタウトロジー扱いしない", () => {
  const pair: CandidatePairMeta = {
    keyX: "engel-coefficient",
    keyY: "food-expenditure-ratio-multi-person-households",
    titleX: "エンゲル係数",
    titleY: "食料費割合",
    unitX: "％",
    unitY: "％",
    normalizationBasisX: null,
    normalizationBasisY: null,
  };
  const verdict = evaluateTautology(pair);
  assert.equal(verdict.tautological, false);
  assert.equal(verdict.reason, null);
});

test("normalizationBasis が明示されていれば raw-unnormalized 判定をしない", () => {
  const pair: CandidatePairMeta = {
    keyX: "some-count-key",
    keyY: "other-count-key",
    titleX: "何かの件数",
    titleY: "別の件数",
    unitX: "件",
    unitY: "件",
    normalizationBasisX: "人口10万人あたり",
    normalizationBasisY: "人口10万人あたり",
  };
  const verdict = evaluateTautology(pair);
  assert.equal(verdict.tautological, false);
});

test("stemTitle は要件で明示された消費支出額/消費量の接尾辞を剥がす", () => {
  assert.equal(stemTitle("しじみ消費支出額"), stemTitle("しじみ消費量"));
  assert.equal(stemTitle("しじみ消費支出額"), "しじみ");
});

// ─── Pearson / 偏相関 (手計算可能な小さい fixture で一致確認) ────────────────
//
// x = [1,2,3,4,5], y = [2,4,5,4,5] → r = 0.7745966... (電卓で検算可能な標準例)
test("Pearson r は手計算可能な fixture と一致する", () => {
  const { r } = calculatePearsonR([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);
  assert.ok(Math.abs(r - 0.7745966692414834) < 1e-9);
});

test("偏相関は r(AB)=r(AZ)=r(BZ) のとき定義式どおり 0 になる (Z が A,B を説明し尽くす単純ケース)", () => {
  // z = [1,2,3,4,5], a = 2z, b = 3z → r(ab)=r(az)=r(bz)=1 なので分母 0 (未定義 → null)
  const z = [1, 2, 3, 4, 5];
  const a = z.map((v) => v * 2);
  const b = z.map((v) => v * 3);
  const rAB = calculatePearsonR(a, b).r;
  const rAZ = calculatePearsonR(a, z).r;
  const rBZ = calculatePearsonR(b, z).r;
  assert.equal(calculatePartialR(rAB, rAZ, rBZ), null);
});

test("偏相関は r(AB|Z) の定義式で計算される (Z と無相関なら人口調整後もほぼ不変)", () => {
  const a = [1, 2, 3, 4, 5, 6, 7, 8];
  const b = [2, 3, 1, 5, 4, 7, 6, 9];
  const zIndependent = [5, 5, 5, 5, 5, 5, 5, 5]; // 分散0 → r(az)=0 相当にはならないため別ケースで確認
  const rAB = calculatePearsonR(a, b).r;
  // Z が定数だと分散0でr=0扱いになる calculatePearsonR の仕様を利用
  const rAZ = calculatePearsonR(a, zIndependent).r;
  const rBZ = calculatePearsonR(b, zIndependent).r;
  assert.equal(rAZ, 0);
  assert.equal(rBZ, 0);
  const partial = calculatePartialR(rAB, rAZ, rBZ);
  assert.ok(partial !== null && Math.abs(partial - rAB) < 1e-9);
});

// ─── 47都道府県 join / 年次ギャップ / 人口調整ゲート ─────────────────────────

function makeRows(n: number, offset = 0) {
  return Array.from({ length: n }, (_, i) => ({
    areaCode: String(i + 1).padStart(5, "0"),
    areaName: `県${i + 1}`,
    value: i + 1 + offset,
  }));
}

test("joinByPrefecture は areaCode で突合し、47件そろわない場合は件数が47未満になる", () => {
  const xRows = makeRows(47);
  const yRows = makeRows(46); // 1件欠落
  const joined = joinByPrefecture(xRows, yRows);
  assert.notEqual(joined.length, REQUIRED_PREFECTURE_COUNT);
  assert.equal(joined.length, 46);
});

test("joinByPrefecture は47件そろえば REQUIRED_PREFECTURE_COUNT と一致する", () => {
  const xRows = makeRows(47);
  const yRows = makeRows(47, 100);
  const joined = joinByPrefecture(xRows, yRows);
  assert.equal(joined.length, REQUIRED_PREFECTURE_COUNT);
});

test("欠測値(null)を持つ行は突合から除外し、0として混ぜない", () => {
  const xRows = makeRows(47);
  const yRows = makeRows(47, 0).map((r, i) => (i === 0 ? { ...r, value: null } : r));
  const joined = joinByPrefecture(xRows, yRows);
  assert.equal(joined.length, 46);
  assert.ok(!joined.some((r) => r.areaCode === "00001"));
});

test("yearGapExceedsLimit は5年を境に判定する", () => {
  assert.equal(yearGapExceedsLimit("2024", "2019"), false);
  assert.equal(yearGapExceedsLimit("2024", "2018"), true);
  assert.equal(yearGapExceedsLimit("2024", "2024"), false);
});

test("MIN_POPULATION_ADJUSTED_R は 0.5 / MAX_POPULATION_ADJUSTED_R は 0.95 (2026-09-23 強化後の帯)", () => {
  assert.equal(MIN_POPULATION_ADJUSTED_R, 0.5);
  assert.equal(MAX_POPULATION_ADJUSTED_R, 0.95);
});

// ─── category 差分 + 人口調整後 r の帯 (2026-09-23 追加のハード gate) ────────

test("同一categoryのペアはr/rPopulationAdjustedに関わらずsame-categoryで弾く", () => {
  const verdict = evaluateCategoryRangeGate({
    categoryX: "economy",
    categoryY: "economy",
    rPopulationAdjusted: 0.7,
  });
  assert.equal(verdict.ok, false);
  assert.equal(verdict.reason, "same-category");
});

test("category違いでも人口調整後rが0.5未満はbelow-min-rで弾く", () => {
  const verdict = evaluateCategoryRangeGate({
    categoryX: "economy",
    categoryY: "population",
    rPopulationAdjusted: 0.42,
  });
  assert.equal(verdict.ok, false);
  assert.equal(verdict.reason, "below-min-r");
});

test("category違いでも人口調整後rが0.95以上は定義同一を疑いsuspicious-definitional-rで弾く", () => {
  const verdict = evaluateCategoryRangeGate({
    categoryX: "economy",
    categoryY: "laborwage",
    rPopulationAdjusted: 0.97,
  });
  assert.equal(verdict.ok, false);
  assert.equal(verdict.reason, "suspicious-definitional-r");
});

test("category違い・0.5<=|r|<0.95の帯は通過する (実際の実収入x家賃差引ペアはこの帯では弾かれない設計なので0.99は別で弾く)", () => {
  const verdict = evaluateCategoryRangeGate({
    categoryX: "economy",
    categoryY: "laborwage",
    rPopulationAdjusted: -0.8,
  });
  assert.equal(verdict.ok, true);
  assert.equal(verdict.reason, null);
});

// ─── ハイライト (回帰直線の両端 + 残差の外れ値) ──────────────────────────────

test("computeFittedLineHighlights はtrendAnchorsとoutliersを重複なく4県返す", () => {
  // ほぼ完全な直線 y=x に、1点だけ大きく外れる outlier を混ぜる
  const points = Array.from({ length: 10 }, (_, i) => ({
    areaCode: String(i).padStart(5, "0"),
    name: `県${i}`,
    x: i,
    y: i,
  }));
  points[5] = { ...points[5], y: 50 }; // 明確な外れ値
  const { trendAnchors, outliers } = computeFittedLineHighlights(points);
  assert.equal(trendAnchors.length, 2);
  assert.equal(outliers.length, 2);
  const codes = [...trendAnchors, ...outliers].map((p) => p.areaCode);
  assert.equal(new Set(codes).size, 4, "4県が重複なく選ばれる");
  assert.ok(outliers.some((p) => p.areaCode === "00005"), "仕込んだ外れ値が検出される");
});

test("分散0 (全県同値) の場合はハイライトを計算せず空を返す", () => {
  const points = Array.from({ length: 10 }, (_, i) => ({
    areaCode: String(i).padStart(5, "0"),
    name: `県${i}`,
    x: 1,
    y: 1,
  }));
  const { trendAnchors, outliers } = computeFittedLineHighlights(points);
  assert.deepEqual(trendAnchors, []);
  assert.deepEqual(outliers, []);
});

// ─── 文言 (因果を示唆しない) ─────────────────────────────────────────────────

test("buildHook は r の符号で疑問形の文言を変える", () => {
  assert.equal(buildHook("X", "Y", 0.8), "Xが多い県ほど、Yも多い？");
  assert.equal(buildHook("X", "Y", -0.8), "Xが多い県ほど、Yは少ない？");
});

test("buildCautionLine は因果関係を否定する固定文言と人口調整後rを含む", () => {
  const line = buildCautionLine(0.512);
  assert.match(line, /相関は因果関係を示しません/);
  assert.match(line, /r=0\.51/);
});
