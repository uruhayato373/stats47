import { buildRecipe, getMetricConfig, METRICS_REGISTRY, type MetricConfig } from "@stats47/data-configs";
import { describe, expect, it } from "vitest";

import {
  buildNormalizationOptions,
  buildRankingItemFromMetric,
  resolveSurveyLinkage,
  usesAllSourcesLinkageFallback,
  yearNameOf,
} from "../build-ranking-item-from-metric";

const NOW = "2026-06-03T00:00:00.000Z";

/** total-population 相当の最小 config (live item.json との突合用 fixture) */
const baseConfig: MetricConfig = {
  key: "total-population",
  title: "総人口",
  unit: "人",
  category: "population",
  source: {
    kind: "estat",
    statsDataId: "0000010101",
    cdCat01: "A1101",
    displayName: "社会・人口統計体系",
    url: "https://www.stat.go.jp/data/ssds/index.htm",
  },
  entities: ["prefecture"],
  years: { from: 2009, to: 2024 },
  yearFormat: "fiscal",
  visualization: { domain: { mode: 'extent' },
    trendDomain: { mode: 'extent', padding: 0.08 }, comparisonDomain: { mode: 'extent', padding: 0.05 },
    colorScheme: "interpolateBlues",
    colorSchemeType: "sequential",

  },
  display: { conversionFactor: 1, decimalPlaces: 0 },
  calculation: { isCalculated: false },
  surveyId: "census",
  tags: ["人口", "人口動態"],
  isActive: true,
};

describe("yearNameOf", () => {
  it("fiscal は '年度'", () => {
    expect(yearNameOf("2024", "fiscal")).toBe("2024年度");
  });
  it("calendar は '年'", () => {
    expect(yearNameOf("2024", "calendar")).toBe("2024年");
  });
  it("未指定は '年' (calendar 扱い)", () => {
    expect(yearNameOf("2024", undefined)).toBe("2024年");
  });
});

describe("buildRankingItemFromMetric", () => {
  it.each([
    "clothing-footwear", "culture-recreation", "education", "furniture-household",
    "health-medical", "housing", "other-living", "transport-communication", "utilities",
    "food", "consumption",
  ])("%s expenditure is already per household and must not be divided by prefecture population/area", (prefix) => {
    // Official table: https://www.stat.go.jp/data/kakei/rank/singleyear.html
    const config = getMetricConfig(`${prefix}-expenditure-total`)!;
    expect(config.source.kind).toBe("kakei-chousa");
    expect(config.unit).toBe("円");
    // 1 世帯当たりの印は subtitle ではなく description に置く (subtitle に調査方法の定型文を書かない。a3c942343)
    expect(config.description).toContain("1世帯当たり");
    expect(config.calculation?.normalizationOptions).toBeUndefined();
    const item = buildRankingItemFromMetric(config, { values: { yearCodes: ["2024"] }, now: NOW });
    expect(item.calculation?.normalizationOptions).toBeUndefined();
    expect(item.latestYear?.yearCode).toBe("2024");
  });

  it("live item.json (total-population) の主要フィールドを再現する", () => {
    const item = buildRankingItemFromMetric(baseConfig, {
      values: { yearCodes: ["2024", "2023", "2022"] },
      now: NOW,
      existing: { createdAt: "2025-11-09 04:27:32" },
    });

    expect(item.rankingKey).toBe("total-population");
    expect(item.areaType).toBe("prefecture");
    expect(item.rankingName).toBe("総人口");
    expect(item.title).toBe("総人口");
    expect(item.readerLabel).toBe("人口");
    expect(item.unit).toBe("人");
    expect(item.categoryKey).toBe("population");
    expect(item.isActive).toBe(true);
    // hook は title/unit から導出する (config に列を持たない)。
    // total-population は override があるので、そちらが優先される
    expect(item.hook).toBe("人口が最も多い県は？");
    expect(item.surveyId).toBe("census");
    expect(item.dataSourceId).toBe("estat");
    expect(item.tags).toEqual([{ tagKey: "人口" }, { tagKey: "人口動態" }]);
    expect(item.valueDisplay).toEqual({ conversionFactor: 1, decimalPlaces: 0 });
    expect(item.visualization).toMatchObject({ domain: { mode: 'extent' },
    classification: { method: 'quantile', classes: 5 }, trendDomain: { mode: 'extent', padding: 0.08 }, comparisonDomain: { mode: 'extent', padding: 0.05 },
      colorScheme: "interpolateBlues",
      colorSchemeType: "sequential",

    });
    // 新形: 実行可能な estatParams と宣言部 recipe を分離する。
    // 旧形は statsDataId/cdCat01/cdCat02 を手選びして flat に置くだけで、
    // オンデマンド経路が丸ごと spread して cdCat03 以降を落としていた。
    expect(item.sourceConfig).toEqual({
      recipe: buildRecipe(baseConfig),
      // survey-bucketing の SSDS 判定が参照する後方互換キー
      source: { name: "社会・人口統計体系", url: "https://www.stat.go.jp/data/ssds/index.htm" },
    });
    // 単発クエリで再現できる metric なので derived は立たない
    expect(item.sourceConfig?.recipe.derived).toBe(false);
    expect(item.sourceConfig?.recipe?.configHash).toMatch(/^[0-9a-f]{16}$/);
    // createdAt は既存を保持、updatedAt は now
    expect(item.createdAt).toBe("2025-11-09 04:27:32");
    expect(item.updatedAt).toBe(NOW);
  });

  it("正準名とは別に読者向けラベルと問いかけを焼き込む", () => {
    const item = buildRankingItemFromMetric(
      {
        ...baseConfig,
        key: "hobby-participation-rate-diy",
        title: "日曜大工の行動者率",
        unit: "％",
      },
      { values: null, now: NOW },
    );

    expect(item.rankingName).toBe("日曜大工の行動者率");
    expect(item.title).toBe("日曜大工の行動者率");
    expect(item.readerLabel).toBe("日曜大工をした人の割合");
    expect(item.hook).toBe("日曜大工をした人が多い県は？");
  });

  it("fiscal の availableYears は降順で yearName='年度'、latestYear は先頭", () => {
    const item = buildRankingItemFromMetric(baseConfig, {
      values: { yearCodes: ["2024", "2023", "2022"] },
      now: NOW,
    });
    expect(item.latestYear).toEqual({ yearCode: "2024", yearName: "2024年度" });
    expect(item.availableYears).toEqual([
      { yearCode: "2024", yearName: "2024年度" },
      { yearCode: "2023", yearName: "2023年度" },
      { yearCode: "2022", yearName: "2022年度" },
    ]);
  });

  it("calendar の yearName は '年' (既存 item.json の '年度' 誤りを是正)", () => {
    const item = buildRankingItemFromMetric(
      { ...baseConfig, yearFormat: "calendar" },
      { values: { yearCodes: ["2005"] }, now: NOW },
    );
    expect(item.availableYears).toEqual([{ yearCode: "2005", yearName: "2005年" }]);
  });

  it("values=null なら latestYear/availableYears は null", () => {
    const item = buildRankingItemFromMetric(baseConfig, { values: null, now: NOW });
    expect(item.latestYear).toBeNull();
    expect(item.availableYears).toBeNull();
  });

  it("surveyId 省略時は source から決定的導出 (A1101=SSDS → census+population-estimates)", () => {
    const { surveyId: _s, tags: _t, ...noEditorial } = baseConfig;
    const item = buildRankingItemFromMetric(noEditorial as MetricConfig, {
      values: null,
      now: NOW,
    });
    // config.surveyId 無し → provenance 辞書導出が surveyIds/originalSurveys/surveyId を埋める
    const ids = [...(item.surveyIds ?? [])];
    expect([...ids].sort()).toEqual(["census", "population-estimates"]);
    expect(item.surveyId).toBe(ids[0] ?? null); // 主参照は導出順の先頭
    expect((item.originalSurveys ?? []).map((s) => s.id)).toEqual(ids);
    expect(item.tags).toEqual([]);
  });

  it("config.surveyId は手動オーバーライドとして先頭に来る", () => {
    const item = buildRankingItemFromMetric(baseConfig, { values: null, now: NOW });
    expect(item.surveyId).toBe("census");
    expect(item.surveyIds?.[0]).toBe("census");
  });

  it("導出不能な source (external displayName なし相当) は surveyIds=[] (未分類)", () => {
    const item = buildRankingItemFromMetric(
      {
        ...baseConfig,
        surveyId: undefined,
        source: { kind: "estat", statsDataId: "9999999999" },
      } as MetricConfig,
      { values: null, now: NOW },
    );
    expect(item.surveyIds).toEqual([]);
    expect(item.surveyId).toBeNull();
  });

  it("isActive の undefined は false に正規化", () => {
    const { isActive: _a, ...minimal } = baseConfig;
    const item = buildRankingItemFromMetric(minimal as MetricConfig, {
      values: null,
      now: NOW,
    });
    expect(item.isActive).toBe(false);
  });

  it("createdAt は existing 無ければ now を使う", () => {
    const item = buildRankingItemFromMetric(baseConfig, { values: null, now: NOW });
    expect(item.createdAt).toBe(NOW);
    expect(item.updatedAt).toBe(NOW);
  });

  // ★焼き忘れガード (2026-08-05)。calculation の宣言は item.json に焼かれて初めて
  // runtime の計算に効く。CalculationOptions にフィールドを足して buildCalculation の
  // spread を忘れると、型は通り値も NaN にならず「静かに換算されない」— 月額から年額を
  // 引いた誤値が 47 県すべてに出た事故と同じ壊れ方になる。宣言 → item.json の経路を固定する。
  it("calculation の periodAlign / scaleFactor を item.json に焼き込む", () => {
    const config: MetricConfig = {
      ...baseConfig,
      calculation: {
        isCalculated: true,
        type: "subtraction",
        numeratorKey: "disposable-income-worker-households",
        denominatorKey: "private-rent-consumption-expenditure",
        periodAlign: { numerator: "monthly", denominator: "annual", result: "monthly" },
        scaleFactor: 100,
      },
    };
    const item = buildRankingItemFromMetric(config, { values: null, now: NOW });

    expect(item.calculation?.periodAlign).toEqual({
      numerator: "monthly",
      denominator: "annual",
      result: "monthly",
    });
    expect(item.calculation?.scaleFactor).toBe(100);
  });

  it("periodAlign / scaleFactor 未宣言の metric には両フィールドを付けない", () => {
    // 既定値を勝手に焼くと「宣言していない」と「monthly 指定」が区別できなくなる。
    const item = buildRankingItemFromMetric(baseConfig, { values: null, now: NOW });
    expect(item.calculation).not.toHaveProperty("periodAlign");
    expect(item.calculation).not.toHaveProperty("scaleFactor");
  });
});

describe("系列の終わり (seriesEnd) の注記", () => {
  it("終わった年と理由を注記の先頭に出し、既存の note を後ろに続ける。無ければ note だけ", () => {
    const ended = buildRankingItemFromMetric(
      { ...baseConfig, note: "県庁所在市の値", seriesEnd: { lastYear: 2024, reason: "品目の統合" } },
      { values: { yearCodes: ["2024"] }, now: NOW },
    );
    expect(ended.annotation).toBe("この系列は 2024 年で終わっている (品目の統合)。 県庁所在市の値");

    const ongoing = buildRankingItemFromMetric(
      { ...baseConfig, note: "県庁所在市の値" },
      { values: { yearCodes: ["2024"] }, now: NOW },
    );
    expect(ongoing.annotation).toBe("県庁所在市の値");
  });
});

/** 主出典が調査マスタに無く、全原典での紐付けを残している公開中の指標 (2026-11-14 時点 17 件。減らすだけ) */
const ALL_SOURCES_FALLBACK_KEYS: string[] = [
  "annual-emergency-dispatches-per-1000",
  "certified-childcare-center-count-per-100k-0-5",
  "fire-department-dispatch-count-per-100-thousand-people",
  "fire-department-emergency-car-count-per-100k",
  "fire-department-member-count-per-100-thousand-people",
  "fire-department-pump-car-count-per-100-thousand-people",
  "fire-department-water-count-per-100-thousand-people",
  "fire-dispatch-for-building-fire-count-per-100k",
  "japan-health-insurance-society-enrollees-per-1000",
  "mobile-phone-contract-count-per-1000",
  "passport-issuance-count-per-thousand",
  "pollution-complaints-received-per-100k",
  "public-elementary-school-gym-installation-rate",
  "public-elementary-school-pool-installation-rate",
  "public-high-school-pool-installation-rate",
  "public-junior-high-school-gym-installation-rate",
  "public-junior-high-school-pool-installation-rate",
];

describe("resolveSurveyLinkage: 調査のページへ並べるのは主出典 (計算式の分子) の調査だけ", () => {
  // 2026-09-25 の UI 全面点検で、国勢調査のページに他の調査の指標が並んでいた (SURVEY-PAGES-01)。
  // 社会・人口統計体系の指標は「分子 / 人口・面積」で、分母の資料源 (国勢調査・人口推計・面積調) まで調査に数えていた。
  it.each([
    ["road-length-per-km2", ["road-statistics"]],
    ["crude-birth-rate", ["vital-statistics"]],
    // 分子の基礎項目に資料源の手当てがある指標は、人口の調査ではなく手当ての原典へ結ぶ
    ["bank-deposit-balance-per-person", ["boj-statistics"]],
  ])("%s は分母の調査 (国勢調査・人口推計・面積調) へ紐付けない", (key, expected) => {
    const { surveyIds, originalSurveys } = resolveSurveyLinkage(getMetricConfig(key)!, METRICS_REGISTRY);
    expect(surveyIds).toEqual(expected);
    expect(originalSurveys.map((survey) => survey.id)).toEqual(expected);
  });

  it("警察費 (1 人当たり) は国勢調査へ紐付けない", () => {
    const { surveyIds } = resolveSurveyLinkage(
      getMetricConfig("per-capita-police-expenditure-pref-municipal")!,
      METRICS_REGISTRY,
    );
    expect(surveyIds.length).toBeGreaterThan(0);
    expect(surveyIds).not.toContain("census");
    expect(surveyIds).not.toContain("population-estimates");
  });

  it.each([
    // 基礎項目と、分子が国勢調査の指標は国勢調査のまま
    ["day-time-population-ratio", ["census"]],
    ["total-population", ["census", "population-estimates"]],
    ["population-density-per-km2-total-area", ["census", "population-estimates"]],
  ])("%s は国勢調査由来なので国勢調査へ紐付けたまま", (key, expected) => {
    const { surveyIds } = resolveSurveyLinkage(getMetricConfig(key)!, METRICS_REGISTRY);
    expect([...surveyIds].sort()).toEqual(expected);
  });

  it("出典の表記 (attribution) は分母の資料源も含めた全原典のまま", () => {
    const item = buildRankingItemFromMetric(getMetricConfig("crude-birth-rate")!, {
      values: { yearCodes: ["2023"] },
      now: NOW,
      registry: METRICS_REGISTRY,
    });
    expect(item.surveyIds).toEqual(["vital-statistics"]);
    expect(item.attribution?.originalSurveys.map((survey) => survey.id).sort()).toEqual([
      "census",
      "population-estimates",
      "vital-statistics",
    ]);
  });

  it("主出典が調査マスタに無い指標だけは、全原典での紐付けを残す (一覧は減らすだけ)", () => {
    // 原典 (消防年報・救急・救助の現況・公共施設状況調・旅券統計など) を調査マスタへ登録すると、ここから外れて
    // 分母の調査のページにも並ばなくなる。新しい指標がここに増えたら、原典の登録か対応表の追記で解く。
    const fallback = Object.values(METRICS_REGISTRY)
      .filter((config) => config.isActive !== false)
      .filter((config) => usesAllSourcesLinkageFallback(config, METRICS_REGISTRY))
      .map((config) => config.key)
      .sort();
    expect(fallback).toEqual(ALL_SOURCES_FALLBACK_KEYS);
    // 未分類にはしない (公開中の指標の調査への紐付け件数を減らさない)
    for (const key of ALL_SOURCES_FALLBACK_KEYS) {
      expect(resolveSurveyLinkage(getMetricConfig(key)!, METRICS_REGISTRY).surveyIds.length).toBeGreaterThan(0);
    }
  });
});

// 題と説明文は、定義に書いてあればそれを使い、無ければ最新年の観測値から作る (SEO-META-FROM-VALUES-01)。
// 定義に年と値を手で書くと、新しい年を取り込んでも題が古い年のまま残った (2026-11-23 医療施設の 6 指標)
describe("buildRankingItemFromMetric の題と説明文", () => {
  const latestRows = [
    { areaCode: "13000", areaName: "東京都", value: 14_000_000, rank: 1 },
    { areaCode: "31000", areaName: "鳥取県", value: 540_000, rank: 2 },
  ];

  it("定義に題が無ければ、最新年の観測値から作る", () => {
    const item = buildRankingItemFromMetric(baseConfig, {
      values: { yearCodes: ["2024", "2023"], latestRows },
      now: NOW,
    });
    expect(item.seoTitle).toMatch(/^総人口ランキング都道府県【2024年度】｜1位東京都（/);
    expect(item.seoDescription).toMatch(/^2024年度の総人口の都道府県別ランキング。1位東京都（.+）、最下位鳥取県（.+）で25\.9倍の格差。/);
  });

  it("定義に書いた題と説明文は、観測値があってもそのまま使う (年と値を含まない言い回しの上書き)", () => {
    const item = buildRankingItemFromMetric(
      { ...baseConfig, seoTitle: "総人口ランキング｜手書き", seoDescription: "手書きの説明" },
      { values: { yearCodes: ["2024"], latestRows }, now: NOW },
    );
    expect(item.seoTitle).toBe("総人口ランキング｜手書き");
    expect(item.seoDescription).toBe("手書きの説明");
  });

  it("観測値が無い指標は題を作らない (ページは指標の名前に戻す)", () => {
    const item = buildRankingItemFromMetric(baseConfig, { values: null, now: NOW });
    expect(item.seoTitle).toBeNull();
    expect(item.seoDescription).toBeNull();
  });
});

describe("buildNormalizationOptions — series (別の指標の公表値を出す見方)", () => {
  it("定義には指標と名前だけを書き、単位・桁・色はその指標の定義から焼く (2026-11-25)", () => {
    const parent = METRICS_REGISTRY["manufacturing-shipment-amount"];
    const child = METRICS_REGISTRY["manufacturing-shipment-amount-per-employee"];
    const series = buildNormalizationOptions(parent, METRICS_REGISTRY)?.find(
      (option) => option.type === "series" && option.metric === child.key,
    );
    expect(series).toMatchObject({ type: "series", label: "従業者1人当たり", unit: child.unit });
    expect(series && series.type === "series" ? series.valueDisplay?.decimalPlaces : null).toBe(child.display?.decimalPlaces ?? 0);
  });

  it("名前は選んだ先の指標の分母から作り、サイトで割った選択肢と同じ名前なら「・公表値」で見分ける (2026-11-26)", () => {
    const byMetric = (parentKey: string, childKey: string) =>
      buildNormalizationOptions(METRICS_REGISTRY[parentKey], METRICS_REGISTRY)?.find(
        (option) => option.type === "series" && option.metric === childKey,
      )?.label;
    // 手書きは「人口当たり」だった。計算式は児童数 ÷ 学級数
    expect(byMetric("elementary-school-children-count", "elementary-school-children-1-per")).toBe("1学級当たり");
    // 親はサイトで割った「人口10万人当たり」も持つ。公表値は比例しない (比の変動係数 17%) ので残し、名前で見分ける
    expect(byMetric("public-bath-count", "public-bath-count-per-100k")).toBe("人口10万人当たり・公表値");
  });

  it("名前が決まらなければ例外にする (分母の型も label も無い)", () => {
    const parent = { ...baseConfig, calculation: { isCalculated: false, normalizationOptions: [{ type: "series" as const, metric: "total-population" }] } };
    const registry = { ...METRICS_REGISTRY, "total-population": { ...METRICS_REGISTRY["total-population"], denominator: undefined } };
    expect(() => buildNormalizationOptions(parent, registry)).toThrow(/名前が決まらない/);
  });

  it("series の指標が registry に無ければ例外にする (黙って空の見方を配信しない)", () => {
    const parent = {
      ...baseConfig,
      calculation: { isCalculated: false, normalizationOptions: [{ type: "series" as const, metric: "no-such-metric", label: "存在しない" }] },
    };
    expect(() => buildNormalizationOptions(parent, METRICS_REGISTRY)).toThrow(/no-such-metric/);
  });
});
