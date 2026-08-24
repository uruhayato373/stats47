import { buildRecipe, type MetricConfig } from "@stats47/data-configs";
import { describe, expect, it } from "vitest";

import { buildRankingItemFromMetric, yearNameOf } from "../build-ranking-item-from-metric";

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
  visualization: {
    colorScheme: "interpolateBlues",
    colorSchemeType: "sequential",
    minValueType: "data-min",
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
    expect(item.visualization).toMatchObject({
      colorScheme: "interpolateBlues",
      colorSchemeType: "sequential",
      minValueType: "data-min",
    });
    // 新形: 実行可能な estatParams と宣言部 recipe を分離する。
    // 旧形は statsDataId/cdCat01/cdCat02 を手選びして flat に置くだけで、
    // オンデマンド経路が丸ごと spread して cdCat03 以降を落としていた。
    expect(item.sourceConfig).toEqual({
      estatParams: { statsDataId: "0000010101", cdCat01: "A1101" },
      recipe: buildRecipe(baseConfig),
      // survey-bucketing の SSDS 判定が参照する後方互換キー
      statsDataId: "0000010101",
      cdCat01: "A1101",
      source: { name: "社会・人口統計体系", url: "https://www.stat.go.jp/data/ssds/index.htm" },
    });
    // 単発クエリで再現できる metric なので derived は立たない
    expect(item.sourceConfig?.derived).toBeUndefined();
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
