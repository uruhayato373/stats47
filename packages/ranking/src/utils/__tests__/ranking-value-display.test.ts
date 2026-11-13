import { describe, expect, it } from "vitest";

import { deriveFeaturedTopList } from "../../exporters/home-featured";
import { applyRankingValueDisplay, formatFeaturedValueDisplay, resolveRankingValueDisplay } from "../ranking-value-display";

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

describe("cards that carry formatted values use the same display unit as the page", () => {
  const rows = [
    { areaCode: "11000", areaName: "埼玉県", value: 639_356, rank: 1 },
    { areaCode: "13000", areaName: "東京都", value: 631_827, rank: 2 },
    { areaCode: "47000", areaName: "沖縄県", value: null, rank: null },
  ];

  it("converts the values and keeps the ranks given to the stored values", () => {
    const display = resolveRankingValueDisplay({ unit: "円", valueDisplay: AUTHORED_MAN_YEN }, rows.map((r) => r.value));
    expect(deriveFeaturedTopList(applyRankingValueDisplay(rows, display), 3)).toEqual([
      { rank: 1, areaName: "埼玉県", value: "63.9" },
      { rank: 2, areaName: "東京都", value: "63.2" },
    ]);
  });

  it("leaves rows alone when no display unit applies", () => {
    expect(applyRankingValueDisplay(rows, null)).toEqual(rows);
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

  it("does not guess when the text is not a number", () => {
    expect(formatFeaturedValueDisplay({ unit: "千円", valueDisplay: null }, "—")).toEqual({ value: "—", unit: "千円" });
  });
});
