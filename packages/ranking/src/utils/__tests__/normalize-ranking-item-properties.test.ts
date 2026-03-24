import { describe, expect, it } from "vitest";
import type { RankingItem } from "../../types/ranking-item";
import {
  getDisplayUnit,
  normalizeRankingItemProperties,
  toRankingItemForDisplay,
} from "../normalize-ranking-item-properties";

const baseItem: RankingItem = {
  rankingKey: "test",
  areaType: "prefecture",
  rankingName: "正式名称",
  title: "表示用タイトル",
  unit: "人",
  dataSourceId: "test",
  isActive: true,
  isFeatured: false,
  featuredOrder: 0,
  createdAt: "",
  updatedAt: "",
};

describe("normalizeRankingItemProperties", () => {
  it("各プロパティが正しくフォールバックされる", () => {
    const item = { ...baseItem, annotation: "注釈", description: "定義" };
    const normalized = normalizeRankingItemProperties(item);
    expect(normalized.displayTitle).toBe("表示用タイトル");
    expect(normalized.displayDescription).toBe("注釈");
  });

  it("空のプロパティが適切に処理される", () => {
    const item = {
      ...baseItem,
      title: "",
      annotation: "",
      description: "定義原文",
    };
    const normalized = normalizeRankingItemProperties(item);
    expect(normalized.displayTitle).toBe("正式名称");
    expect(normalized.displayDescription).toBe("定義原文");
  });

  it("displayUnit が含まれること", () => {
    const item = { ...baseItem, unit: "件" };
    const normalized = normalizeRankingItemProperties(item);
    expect(normalized.displayUnit).toBe("件");
  });
});

describe("getDisplayUnit", () => {
  it("valueDisplay.displayUnit を優先すること", () => {
    const item = {
      ...baseItem,
      unit: "人",
      valueDisplay: { displayUnit: "千人", conversionFactor: 0.001, decimalPlaces: 1 },
    };
    expect(getDisplayUnit(item)).toBe("千人");
  });

  it("valueDisplay がない場合は item.unit を返すこと", () => {
    const item = { ...baseItem, unit: "件" };
    expect(getDisplayUnit(item)).toBe("件");
  });

  it("unit も displayUnit も空の場合は空文字を返すこと", () => {
    const item = { ...baseItem, unit: "" };
    expect(getDisplayUnit(item)).toBe("");
  });
});

describe("toRankingItemForDisplay", () => {
  it("全フィールドが正しくマッピングされること", () => {
    const item: RankingItem = {
      ...baseItem,
      title: "タイトル",
      subtitle: "サブタイトル",
      demographicAttr: "総数",
      normalizationBasis: "人口",
      unit: "件",
      visualization: {
        colorScheme: "interpolateReds",
        colorSchemeType: "sequential",
        minValueType: "zero",
      },
    };
    const result = toRankingItemForDisplay(item);

    expect(result.title).toBe("タイトル");
    expect(result.subtitle).toBe("サブタイトル");
    expect(result.demographicAttr).toBe("総数");
    expect(result.normalizationBasis).toBe("人口");
    expect(result.unit).toBe("件");
    expect(result.visualization?.colorScheme).toBe("interpolateReds");
  });

  it("optional フィールドが未設定の場合は undefined になること", () => {
    const result = toRankingItemForDisplay(baseItem);
    expect(result.subtitle).toBeUndefined();
    expect(result.demographicAttr).toBeUndefined();
    expect(result.normalizationBasis).toBeUndefined();
    expect(result.visualization).toBeUndefined();
  });

  it("valueDisplay.displayUnit が unit として使われること", () => {
    const item: RankingItem = {
      ...baseItem,
      unit: "人",
      valueDisplay: { displayUnit: "千人", conversionFactor: 0.001, decimalPlaces: 1 },
    };
    const result = toRankingItemForDisplay(item);
    expect(result.unit).toBe("千人");
  });
});
