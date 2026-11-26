import { describe, expect, it } from "vitest";

import { buildFeaturedTopRows, formatFeaturedValueDisplay, resolveRankingValueDisplay } from "../ranking-value-display";

const INCOME = [639_356, 528_073, 396_090];
const BUSINESS_TAX = [1_544_976_077, 117_028_009, 14_040_236];
const AUTHORED_MAN_YEN = { conversionFactor: 0.0001, decimalPlaces: 1, displayUnit: "万円" };

describe("the display unit a ranking is shown in, resolved once", () => {
  it("uses the metric's own display unit, factor and decimals (可処分所得: 円 → 万円)", () => {
    expect(resolveRankingValueDisplay({ unit: "円", valueDisplay: AUTHORED_MAN_YEN }, INCOME)).toEqual({ unit: "万円", factor: 0.0001, precision: 1 });
  });

  it("falls back to the chart rule when the definition names no unit (事業税: 千円 → 億円), the unit the ledger records", () => {
    expect(resolveRankingValueDisplay({ unit: "千円", valueDisplay: { conversionFactor: 1, decimalPlaces: 0 } }, BUSINESS_TAX)).toEqual({ unit: "億円", factor: 0.00001, precision: 0 });
  });

  it("shows 実収入 (千円) and 可処分所得 (円) of the household survey in the same unit", () => {
    const actualIncome = resolveRankingValueDisplay({ unit: "千円", valueDisplay: { conversionFactor: 1, decimalPlaces: 1 } }, [794.2, 629.1, 480.3]);
    const disposable = resolveRankingValueDisplay({ unit: "円", valueDisplay: AUTHORED_MAN_YEN }, INCOME);
    expect(actualIncome?.unit).toBe("万円");
    expect(disposable?.unit).toBe("万円");
    expect(794.2 * actualIncome!.factor).toBeCloseTo(79.42);
  });

  it("returns nothing to apply when the values already read well, so those pages keep their data precision", () => {
    expect(resolveRankingValueDisplay({ unit: "％", valueDisplay: { conversionFactor: 1, decimalPlaces: 0 } }, [60.42, 44, 51.3])).toBeNull();
    expect(resolveRankingValueDisplay({ unit: "人", valueDisplay: null }, [230, 21])).toBeNull();
    expect(resolveRankingValueDisplay({ unit: "千円", valueDisplay: null }, [null, undefined])).toBeNull();
  });
});

// 注目カードと一覧の「1 位」の列は、R2 に焼いた整形済みの値 (「656,171,677」) を持つ。2026-11-14 までは
// 「656,171,677千円」「59,314,388百万円」とそのまま書いていた (UNIT-NOTATION-FORMAT-01)
describe("a baked top value is written in the display unit", () => {
  it("rescales a long amount with the chart rule (千円 → 億円, 百万円 → 兆円)", () => {
    expect(formatFeaturedValueDisplay({ unit: "千円", valueDisplay: null }, "656,171,677")).toEqual({ value: "6,562", unit: "億円" });
    expect(formatFeaturedValueDisplay({ unit: "百万円", valueDisplay: null }, "59,314,388")).toEqual({ value: "59.3", unit: "兆円" });
  });

  it("uses the metric's own display unit when the definition names one", () => {
    expect(formatFeaturedValueDisplay({ unit: "円", valueDisplay: AUTHORED_MAN_YEN }, "639,356")).toEqual({ value: "63.9", unit: "万円" });
  });

  it("keeps values that already read well and only tidies the unit", () => {
    expect(formatFeaturedValueDisplay({ unit: "％", valueDisplay: null }, "71.5")).toEqual({ value: "71.5", unit: "%" });
    expect(formatFeaturedValueDisplay({ unit: "時間", valueDisplay: null }, "2,309")).toEqual({ value: "2,309", unit: "時間" });
  });

  it("caps the decimals at the ranking table's limit when the unit stays (65歳以上人口割合: 40.107 → 40.11, as the page title shows)", () => {
    expect(formatFeaturedValueDisplay({ unit: "％", valueDisplay: null }, "40.107")).toEqual({ value: "40.11", unit: "%" });
    // 1 未満の値は表と同じく 3 桁まで残す
    expect(formatFeaturedValueDisplay({ unit: "人口千対", valueDisplay: null }, "0.6612")).toEqual({ value: "0.661", unit: "人口千対" });
  });

  it("does not guess when the text is not a number", () => {
    expect(formatFeaturedValueDisplay({ unit: "千円", valueDisplay: null }, "—")).toEqual({ value: "—", unit: "千円" });
  });
});

describe("buildFeaturedTopRows: the top rows a featured card and the blog card show", () => {
  const row = (rank: number, areaCode: string, areaName: string, value: number | null) => ({ rank, areaCode, areaName, value });

  it("keeps every tie up to rank 3 and writes the values with the table's precision (171.0, not 171)", () => {
    const top = buildFeaturedTopRows({ unit: "cm", valueDisplay: null }, [
      row(1, "15000", "新潟県", 171.0),
      row(1, "18000", "福井県", 171.0),
      row(3, "02000", "青森県", 170.9),
      row(3, "05000", "秋田県", 170.9),
      row(5, "06000", "山形県", 170.6),
    ]);
    expect(top).toEqual({
      unit: "cm",
      rows: [
        { rank: 1, areaName: "新潟県", value: "171.0" },
        { rank: 1, areaName: "福井県", value: "171.0" },
        { rank: 3, areaName: "青森県", value: "170.9" },
        { rank: 3, areaName: "秋田県", value: "170.9" },
      ],
    });
  });

  it("resolves the display unit from all values once, the same as the ranking page (事業税: 千円 → 億円)", () => {
    const top = buildFeaturedTopRows({ unit: "千円", valueDisplay: { conversionFactor: 1, decimalPlaces: 0 } }, [
      row(1, "13000", "東京都", BUSINESS_TAX[0]),
      row(2, "27000", "大阪府", BUSINESS_TAX[1]),
      row(3, "23000", "愛知県", BUSINESS_TAX[2]),
    ]);
    expect(top?.unit).toBe("億円");
    expect(top?.rows[0].value).toBe("15,450");
  });

  it("names the capital city for a capital-city metric (家計調査)", () => {
    const top = buildFeaturedTopRows({ unit: "円", valueDisplay: null }, [row(1, "07000", "福島県", 100)], { capitalCities: true });
    expect(top?.rows[0].areaName).toBe("福島市");
  });

  it("returns null when no row has a value and a rank", () => {
    expect(buildFeaturedTopRows({ unit: "人", valueDisplay: null }, [row(1, "13000", "東京都", null)])).toBeNull();
  });
});
