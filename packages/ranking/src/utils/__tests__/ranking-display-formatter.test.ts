import { describe, expect, it } from "vitest";
import { buildRankingDisplayContext, buildRankingPageTitle } from "../ranking-display-formatter";

describe("buildRankingPageTitle", () => {
  it.each([
    ["年間日照時間", "prefecture", "都道府県別 年間日照時間ランキング"],
    ["総人口", "city", "市区町村別 総人口ランキング"],
    ["総人口（面積100km²あたり）", "prefecture", "都道府県別 総人口（面積100km²あたり）ランキング"],
    ["輸出額", "port", "港湾別 輸出額ランキング"],
    ["消費支出", "national", "全国 消費支出ランキング"],
  ] as const)("指標 %s と地域粒度 %s から生成する", (metric, scope, expected) => {
    expect(buildRankingPageTitle(metric, scope)).toBe(expected);
  });
});

describe("buildRankingDisplayContext", () => {
  it("should format title correctly by removing patterns", () => {
    const item = {
      title: "都道府県別人口ランキング（2023年度）",
      subtitle: null,
      demographicAttr: null,
      normalizationBasis: null,
      latestYear: null,
      unit: "人",
    };
    const context = buildRankingDisplayContext(item);
    expect(context.title).toBe("人口");
    expect(context.yearName).toBe("");
    expect(context.subtitle).toBe("");
    expect(context.attributes).toBe("");
    expect(context.unit).toBe("人");
    expect(context.decimalPlaces).toBe(0);
  });

  it("should handle subtitle and latestYear", () => {
    const item = {
      title: "人口",
      subtitle: "総人口",
      demographicAttr: null,
      normalizationBasis: null,
      latestYear: { yearCode: "2020", yearName: "2020年度" },
      unit: "人",
    };
    const context = buildRankingDisplayContext(item);
    expect(context.title).toBe("人口");
    expect(context.yearName).toBe("2020年度");
    expect(context.subtitle).toBe("総人口");
  });

  it("should combine demographicAttr and normalizationBasis with dot separator", () => {
    const item = {
      title: "人口",
      subtitle: null,
      demographicAttr: "15歳未満",
      normalizationBasis: "人口10万人あたり",
      latestYear: null,
      unit: "人",
    };
    const context = buildRankingDisplayContext(item);
    expect(context.attributes).toBe("15歳未満・人口10万人あたり");
  });

  it("should handle only demographicAttr", () => {
    const item = {
      title: "人口",
      subtitle: null,
      demographicAttr: "15歳未満",
      normalizationBasis: null,
      latestYear: null,
      unit: "人",
    };
    const context = buildRankingDisplayContext(item);
    expect(context.attributes).toBe("15歳未満");
  });

  it("should handle only normalizationBasis", () => {
    const item = {
      title: "人口",
      subtitle: null,
      demographicAttr: null,
      normalizationBasis: "人口10万人あたり",
      latestYear: null,
      unit: "人",
    };
    const context = buildRankingDisplayContext(item);
    expect(context.attributes).toBe("人口10万人あたり");
  });

  it("should handle decimalPlaces from valueDisplay", () => {
    const item = {
      title: "有効求人倍率",
      subtitle: null,
      demographicAttr: null,
      normalizationBasis: null,
      latestYear: null,
      unit: "倍",
      valueDisplay: { decimalPlaces: 2 },
    };
    const context = buildRankingDisplayContext(item);
    expect(context.decimalPlaces).toBe(2);
    expect(context.unit).toBe("倍");
  });
});

describe("buildRankingPageTitle — 前置きの重なり", () => {
  it("題名がすでに「都道府県別」を含むときは前置きを付けない (2026-11-26)", () => {
    expect(buildRankingPageTitle("訪日外国人の都道府県別訪問者数", "prefecture")).toBe("訪日外国人の都道府県別訪問者数ランキング");
    expect(buildRankingPageTitle("総人口", "prefecture")).toBe("都道府県別 総人口ランキング");
    // 地域の単位が違えば前置きは付ける
    expect(buildRankingPageTitle("訪日外国人の都道府県別訪問者数", "city")).toBe("市区町村別 訪日外国人の都道府県別訪問者数ランキング");
  });
});
