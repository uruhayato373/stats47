import { describe, expect, it } from "vitest";
import { formatChartValue, resolveChartDisplayScale } from "../chart-display-scale";

// Values are the latest-year maxima and minima of real rankings (data/metrics/display-units/ledger.json).
describe("resolveChartDisplayScale", () => {
  it("brings large money, people and household counts into 万・億・兆 with at most five digits", () => {
    expect(resolveChartDisplayScale("千円", [1_544_976_077, 14_040_236])).toEqual({ unit: "億円", factor: 1e-5, decimals: 0, reason: "rescaled" });
    expect(resolveChartDisplayScale("百万円", [217_096_446, 1_302_355])).toMatchObject({ unit: "兆円", factor: 1e-6, decimals: 1 });
    expect(resolveChartDisplayScale("人", [13_960_000, 553_000])).toMatchObject({ unit: "万人", factor: 1e-4, decimals: 0 });
    expect(resolveChartDisplayScale("世帯", [7_227_180, 220_000])).toMatchObject({ unit: "万世帯" });
  });

  it("moves units outside the 万 series (千円・千人) into it even when small", () => {
    expect(resolveChartDisplayScale("千円", [12_019, 3_603])).toMatchObject({ unit: "万円", factor: 0.1, decimals: 0 });
    expect(resolveChartDisplayScale("千円", [794, 494])).toMatchObject({ unit: "万円", factor: 0.1, decimals: 1 });
    expect(resolveChartDisplayScale("千人", [1_033.2, 20])).toMatchObject({ unit: "万人", factor: 0.1 });
  });

  it("keeps the unit word of physical quantities instead of returning to g or m²", () => {
    expect(resolveChartDisplayScale("ｈａ", [5_313_000, 5_700])).toMatchObject({ unit: "万ha" });
    expect(resolveChartDisplayScale("t", [646_000, 1_000])).toMatchObject({ unit: "万t", decimals: 1 });
    expect(resolveChartDisplayScale("kW", [5_287_064, 10_000])).toMatchObject({ unit: "万kW" });
  });

  it("brings joules and gross tonnage into 万・億 once the canon reads them (UNIT-VOCAB-LARGE-UNPARSED-01)", () => {
    // final-energy-consumption, city-gas-sales-volume and port-ships-tonnage: six to nine digits when shown as written.
    expect(resolveChartDisplayScale("TJ", [970_018, 60_385])).toEqual({ unit: "万TJ", factor: 1e-4, decimals: 1, reason: "rescaled" });
    expect(resolveChartDisplayScale("万ＭＪ", [23_010_341, 82_733])).toEqual({ unit: "億MJ", factor: 1e-4, decimals: 0, reason: "rescaled" });
    expect(resolveChartDisplayScale("総トン", [399_226_924, 3_203_855])).toEqual({ unit: "万総トン", factor: 1e-4, decimals: 0, reason: "rescaled" });
    // Per-capita energy stays as written: the values are small.
    expect(resolveChartDisplayScale("GJ", [308.84, 63.32])).toMatchObject({ unit: "GJ", factor: 1, reason: "small" });
  });

  it("does not hide a small prefecture as 0: uses a smaller prefix, up to six digits", () => {
    // Fish catch: 850,981 t to 1 t. 万t would show 1 t as 0.0, so the tonnes stay.
    expect(resolveChartDisplayScale("トン", [850_981, 1])).toMatchObject({ unit: "トン", factor: 1, decimals: 0 });
  });

  it("leaves small values, rates, per-population values and units it cannot read as they are", () => {
    expect(resolveChartDisplayScale("円", [45_000, 30_000])).toMatchObject({ unit: "円", factor: 1, decimals: null, reason: "small" });
    expect(resolveChartDisplayScale("％", [99.1, 12.3])).toMatchObject({ factor: 1, reason: "not-quantity" });
    expect(resolveChartDisplayScale("人（人口10万対）", [2_000_000, 1])).toMatchObject({ factor: 1, reason: "not-quantity" });
    // Not interpretable: never assumed to be ×1 of a known unit, only shown as written.
    expect(resolveChartDisplayScale("kg/日", [205_599, 1_007.8])).toMatchObject({ unit: "kg/日", factor: 1, reason: "unparsed" });
    expect(resolveChartDisplayScale("円", [])).toMatchObject({ reason: "no-values" });
  });

  it("reads negative values by their size (net migration)", () => {
    expect(resolveChartDisplayScale("人", [144_000, -60_000, 47])).toMatchObject({ unit: "人", factor: 1 });
    expect(resolveChartDisplayScale("人", [1_440_000, -600_000, 4_000])).toMatchObject({ unit: "万人" });
  });
});

describe("formatChartValue", () => {
  it("rounds to the chart's decimals with grouping", () => {
    expect(formatChartValue(1_544_976_077, { factor: 1e-5, decimals: 0 })).toBe("15,450");
    expect(formatChartValue(217_096_446, { factor: 1e-6, decimals: 1 })).toBe("217.1");
  });
  it("writes a non-zero value that rounds to 0 as 「0.1未満」, and a real 0 as 0", () => {
    expect(formatChartValue(365, { factor: 1e-5, decimals: 1 })).toBe("0.1未満");
    expect(formatChartValue(-365, { factor: 1e-5, decimals: 1 })).toBe("-0.1未満");
    expect(formatChartValue(0, { factor: 1e-5, decimals: 1 })).toBe("0.0");
  });
});
