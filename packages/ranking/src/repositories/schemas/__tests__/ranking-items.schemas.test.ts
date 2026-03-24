import { describe, expect, it } from "vitest";
import {
  RankingItemDBSchema,
  parseRankingItemDBArray,
} from "../ranking-items.schemas";

const baseMockData = {
  ranking_key: "test-key",
  area_type: "prefecture",
  ranking_name: "Test Ranking",
  title: "Test Title",
  subtitle: null,
  demographic_attr: null,
  normalization_basis: null,
  unit: "unit",
  annotation: null,
  description: null,
  latest_year: JSON.stringify({ yearCode: "2020", yearName: "2020年" }),
  available_years: JSON.stringify([{ yearCode: "2020", yearName: "2020年" }]),
  is_active: 1,
  is_featured: 0,
  featured_order: 0,
  data_source_id: "estat",
  source_config: JSON.stringify({ statsDataId: "stats-id" }),
  value_display_config: JSON.stringify({
    conversionFactor: null,
    decimalPlaces: null,
    displayUnit: null,
  }),
  visualization_config: JSON.stringify({
    colorScheme: null,
    colorSchemeType: null,
    minValueType: null,
    divergingMidpoint: null,
    divergingMidpointValue: null,
    isSymmetrized: null,
    isReversed: null,
  }),
  calculation_config: JSON.stringify({
    isCalculated: null,
    type: null,
    numeratorKey: null,
    denominatorKey: null,
  }),
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("RankingItemDBSchema", () => {
  it("should parse RankingItem with null values in optional fields correctly", () => {
    const result = RankingItemDBSchema.parse(baseMockData);

    expect(result.rankingKey).toBe("test-key");
    expect(result.valueDisplay?.displayUnit).toBeUndefined();
    expect(result.visualization?.minValueType).toBeUndefined();
    expect(result.calculation?.type).toBeUndefined();
  });

  describe("is_active boolean 正規化", () => {
    it("number 1 → true", () => {
      const result = RankingItemDBSchema.parse({ ...baseMockData, is_active: 1 });
      expect(result.isActive).toBe(true);
    });

    it("number 0 → false", () => {
      const result = RankingItemDBSchema.parse({ ...baseMockData, is_active: 0 });
      expect(result.isActive).toBe(false);
    });

    it("boolean true → true", () => {
      const result = RankingItemDBSchema.parse({ ...baseMockData, is_active: true });
      expect(result.isActive).toBe(true);
    });

    it("boolean false → false", () => {
      const result = RankingItemDBSchema.parse({ ...baseMockData, is_active: false });
      expect(result.isActive).toBe(false);
    });
  });

  describe("不正JSON の処理", () => {
    it("calculation_config に壊れたJSONが入った場合は undefined になること", () => {
      const result = RankingItemDBSchema.parse({
        ...baseMockData,
        calculation_config: "{ invalid json",
      });
      // parseJsonColumn は JSON.parse に失敗するとundefinedを返す
      expect(result.calculation?.isCalculated).toBe(false); // デフォルト値
    });

    it("source_config に壊れたJSONが入った場合は undefined になること", () => {
      const result = RankingItemDBSchema.parse({
        ...baseMockData,
        source_config: "{ broken",
      });
      expect(result.sourceConfig).toBeUndefined();
    });
  });

  describe("flat列 vs JSON列の優先度", () => {
    it("is_calculated（flat）が calculation_config.isCalculated より優先される", () => {
      const result = RankingItemDBSchema.parse({
        ...baseMockData,
        is_calculated: true, // flat列: true
        calculation_config: JSON.stringify({ isCalculated: false }), // JSON列: false
      });
      // flat列が優先されるため true
      expect(result.calculation?.isCalculated).toBe(true);
    });

    it("calculation_type（flat）が calculation_config.type より優先される", () => {
      const result = RankingItemDBSchema.parse({
        ...baseMockData,
        calculation_type: "per_capita", // flat列
        calculation_config: JSON.stringify({ isCalculated: true, type: "ratio" }), // JSON列
      });
      // flat列が優先されるため per_capita
      expect(result.calculation?.type).toBe("per_capita");
    });

    it("is_calculated が null の場合は calculation_config.isCalculated を使う", () => {
      const result = RankingItemDBSchema.parse({
        ...baseMockData,
        is_calculated: null,
        calculation_config: JSON.stringify({ isCalculated: true }),
      });
      expect(result.calculation?.isCalculated).toBe(true);
    });
  });

  describe("計算タイプのデフォルト化", () => {
    it("calculation.type が 'custom' の場合は undefined になること（Phase 2-9）", () => {
      const result = RankingItemDBSchema.parse({
        ...baseMockData,
        calculation_config: JSON.stringify({ isCalculated: true, type: "custom" }),
      });
      expect(result.calculation?.type).toBeUndefined();
    });

    it("flat列 calculation_type が 'custom' の場合も undefined になること", () => {
      const result = RankingItemDBSchema.parse({
        ...baseMockData,
        calculation_type: "custom",
      });
      expect(result.calculation?.type).toBeUndefined();
    });
  });

  describe("JSON列のデフォルト値適用", () => {
    it("visualization_config が null の場合はデフォルト値が適用される", () => {
      const result = RankingItemDBSchema.parse({
        ...baseMockData,
        visualization_config: null,
      });
      expect(result.visualization?.colorScheme).toBe("interpolateBlues");
      expect(result.visualization?.colorSchemeType).toBe("sequential");
    });

    it("available_years が正しくパースされる", () => {
      const result = RankingItemDBSchema.parse({
        ...baseMockData,
        available_years: JSON.stringify([
          { yearCode: "2021", yearName: "2021年" },
          { yearCode: "2022", yearName: "2022年" },
        ]),
      });
      expect(result.availableYears).toHaveLength(2);
      expect(result.availableYears?.[0].yearCode).toBe("2021");
    });
  });
});

describe("parseRankingItemDBArray", () => {
  it("配列をまとめてパースできること", () => {
    const items = [
      { ...baseMockData, ranking_key: "key-1" },
      { ...baseMockData, ranking_key: "key-2", is_active: 0 },
    ];

    const result = parseRankingItemDBArray(items);

    expect(result).toHaveLength(2);
    expect(result[0].rankingKey).toBe("key-1");
    expect(result[1].rankingKey).toBe("key-2");
    expect(result[1].isActive).toBe(false);
  });

  it("空配列を渡した場合は空配列を返すこと", () => {
    const result = parseRankingItemDBArray([]);
    expect(result).toEqual([]);
  });

  it("不正データが含まれる場合はエラーを throw すること", () => {
    const items = [
      { ...baseMockData, ranking_key: "valid" },
      { ranking_key: null }, // invalid
    ];
    expect(() => parseRankingItemDBArray(items)).toThrow("ランキング項目配列データが不正です");
  });
});
