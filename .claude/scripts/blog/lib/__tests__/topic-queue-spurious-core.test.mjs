/**
 * node --test .claude/scripts/blog/lib/__tests__/
 * TOPIC-QUEUE-SPURIOUS-FILTER-01 の決定的ルールを検証する。
 * fixture は 2026-07-09 記事量産バッチで実際に spurious と判明したペアを基にする。
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  correlationTitle,
  isScaleMetric,
  keyFamily,
  spuriousReasons,
} from "../topic-queue-spurious-core.mjs";

const scatter47 = Array.from({ length: 47 }, (_, i) => ({
  areaCode: `${String(i + 1).padStart(2, "0")}000`,
}));

test("isScaleMetric: 絶対量 (店舗数・診療所数・販売額) は true", () => {
  assert.equal(isScaleMetric({ key: "convenience-store-count", unit: "店" }), true);
  assert.equal(isScaleMetric({ key: "dental-clinic-count", unit: "所" }), true);
  assert.equal(isScaleMetric({ key: "retail-sales-amount", unit: "百万円" }), true);
  assert.equal(isScaleMetric({ key: "total-employment", unit: "人" }), true);
});

test("isScaleMetric: 家計調査 (世帯あたり) は円でも false", () => {
  assert.equal(
    isScaleMetric({ key: "pork-consumption-expenditure", unit: "円", isKakei: true }),
    false,
  );
});

test("isScaleMetric: 比率・派生・あたり単位は false", () => {
  assert.equal(isScaleMetric({ key: "unemployment-rate", unit: "%" }), false);
  assert.equal(isScaleMetric({ key: "doctors-per-100k", unit: "人/10万人" }), false);
  assert.equal(isScaleMetric({ key: "hospital-bed-rate", unit: "床" }), false); // -rate suffix
  assert.equal(
    isScaleMetric({ key: "avg-income", unit: "千円", title: "一人当たり県民所得" }),
    false,
  );
  assert.equal(isScaleMetric({ key: "sunshine", unit: "時間" }), false); // 物理量は規模でない
});

test("isScaleMetric: 加入・個・m2 (電話加入数/公衆電話/床面積) も絶対量", () => {
  assert.equal(isScaleMetric({ key: "telephone-subscription-count", unit: "加入" }), true);
  assert.equal(isScaleMetric({ key: "public-phone-count", unit: "個" }), true);
  assert.equal(isScaleMetric({ key: "new-housing-floor-area", unit: "m2" }), true);
});

test("keyFamily: 消費量 vs 支出額・-commercial を畳む", () => {
  assert.equal(keyFamily("pork-consumption-expenditure"), "pork");
  assert.equal(keyFamily("pork-consumption-quantity"), "pork");
  assert.equal(keyFamily("convenience-store-count-commercial"), "convenience-store-count");
});

// ── 実例 fixture: 2026-07-09 に spurious と判明したペア ──────────────────────

test("実例: コンビニ店舗数 × コンビニ店舗数(商業統計) r=0.99 → self-derived で除外", () => {
  const reasons = spuriousReasons({
    base: { key: "convenience-store-count", unit: "店", category: "commercial", yearTo: 2021 },
    pair: {
      key: "convenience-store-count-commercial",
      unit: "店",
      category: "commercial",
      yearTo: 2016,
    },
    pearsonR: 0.99,
    partialRPopulation: 0.84,
    scatterData: scatter47,
  });
  assert.ok(reasons.includes("self-derived"));
});

test("実例: 小売販売額 × 歯科診療所数 r=0.99 → scale-pair で除外", () => {
  const reasons = spuriousReasons({
    base: { key: "retail-sales-amount", unit: "百万円", category: "commercial", yearTo: 2021 },
    pair: { key: "dental-clinic-count", unit: "所", category: "socialsecurity", yearTo: 2022 },
    pearsonR: 0.99,
    partialRPopulation: 0.5,
    scatterData: scatter47,
  });
  assert.deepEqual(reasons, ["scale-pair"]);
});

test("scale-pair: 偏相関データ無しは閾値を 0.9 に下げる", () => {
  const reasons = spuriousReasons({
    base: { key: "retail-sales-amount", unit: "百万円", category: "commercial", yearTo: 2021 },
    pair: { key: "hospital-count", unit: "施設", category: "socialsecurity", yearTo: 2022 },
    pearsonR: 0.92,
    partialRPopulation: null,
    scatterData: scatter47,
  });
  assert.ok(reasons.includes("scale-pair"));
});

test("same-category: 同一 category ペアは機序距離ゼロで除外", () => {
  const reasons = spuriousReasons({
    base: { key: "apple-shipment", unit: "t", category: "agriculture", yearTo: 2022 },
    pair: { key: "pear-shipment", unit: "t", category: "agriculture", yearTo: 2022 },
    pearsonR: 0.7,
    partialRPopulation: 0.65,
    scatterData: scatter47,
  });
  assert.ok(reasons.includes("same-category"));
});

test("year-mismatch: 最新年が 5 年以上乖離したペアは除外", () => {
  const reasons = spuriousReasons({
    base: { key: "a-count", unit: "件", category: "economy", yearTo: 2016 },
    pair: { key: "b-rate", unit: "%", category: "tourism", yearTo: 2024 },
    pearsonR: 0.7,
    partialRPopulation: 0.6,
    scatterData: scatter47,
  });
  assert.deepEqual(reasons, ["year-mismatch"]);
});

test("low-n / national-mixed: 欠測・全国値混入を除外", () => {
  const reasons = spuriousReasons({
    base: { key: "fishery-catch", unit: "t", category: "agriculture", yearTo: 2022 },
    pair: { key: "port-count", unit: "箇所", category: "infrastructure", yearTo: 2022 },
    pearsonR: 0.7,
    partialRPopulation: 0.6,
    scatterData: [...scatter47.slice(0, 30), { areaCode: "00000" }],
  });
  assert.ok(reasons.includes("low-n"));
  assert.ok(reasons.includes("national-mixed"));
});

// ── 過剰除外の防止: 正当な B型候補は残る ────────────────────────────────────

test("正当な候補: 日照時間 × 通院率 (物理量 × 率・跨ぎ・年一致) は除外されない", () => {
  const reasons = spuriousReasons({
    base: { key: "annual-sunshine-duration", unit: "時間", category: "landweather", yearTo: 2023 },
    pair: { key: "outpatient-rate", unit: "%", category: "socialsecurity", yearTo: 2022 },
    pearsonR: -0.65,
    partialRPopulation: -0.6,
    scatterData: scatter47,
  });
  assert.deepEqual(reasons, []);
});

test("正当な候補: 家計調査ペア (世帯あたり × 世帯あたり・跨ぎ) は高相関でも scale-pair にならない", () => {
  const reasons = spuriousReasons({
    base: {
      key: "butter-consumption-expenditure",
      unit: "円",
      category: "laborwage",
      isKakei: true,
      yearTo: 2024,
    },
    pair: { key: "bread-floor-area", unit: "m²", category: "commercial", yearTo: 2021 },
    pearsonR: 0.96,
    partialRPopulation: 0.7,
    scatterData: scatter47,
  });
  assert.equal(reasons.includes("scale-pair"), false);
});

test("正当な候補: 片方だけ絶対量なら |r|=0.99 でも scale-pair にならない", () => {
  const reasons = spuriousReasons({
    base: { key: "snow-days", unit: "日", category: "landweather", yearTo: 2023 },
    pair: { key: "kerosene-price", unit: "円", category: "economy", yearTo: 2023 },
    pearsonR: 0.99,
    partialRPopulation: 0.9,
    scatterData: scatter47,
  });
  assert.equal(reasons.includes("scale-pair"), false);
});

test("correlationTitle: 「意外な関係」を含まず疑問形 1 要素", () => {
  const pos = correlationTitle("コンビニ", "美容室", 0.7);
  const neg = correlationTitle("日照時間", "うつ受療率", -0.6);
  assert.equal(pos, "コンビニが多い県は美容室も多い?");
  assert.equal(neg, "日照時間が多い県はうつ受療率が少ない?");
  assert.ok(!pos.includes("意外"));
  assert.ok(!neg.includes("意外"));
});
