import { describe, expect, it } from "vitest";
import {
  calculatePearsonR,
  calculatePartialR,
  buildScatterData,
  type RankValueWithArea,
} from "../calculate-pearson";

// ---------------------------------------------------------------------------
// calculatePearsonR
// ---------------------------------------------------------------------------
describe("calculatePearsonR", () => {
  it("should return perfect positive correlation (r=1.0)", () => {
    const result = calculatePearsonR([1, 2, 3], [2, 4, 6]);
    expect(result.r).toBeCloseTo(1.0, 10);
  });

  it("should return perfect negative correlation (r=-1.0)", () => {
    const result = calculatePearsonR([1, 2, 3], [6, 4, 2]);
    expect(result.r).toBeCloseTo(-1.0, 10);
  });

  it("should return approximately zero for uncorrelated data", () => {
    // Orthogonal-ish data designed to yield r near 0
    const x = [1, 2, 3, 4, 5, 6, 7, 8];
    const y = [2, 8, 1, 7, 3, 9, 0, 6];
    const result = calculatePearsonR(x, y);
    expect(Math.abs(result.r)).toBeLessThan(0.3);
  });

  it("should return r=0 when n < 2 (empty arrays)", () => {
    expect(calculatePearsonR([], []).r).toBe(0);
  });

  it("should return r=0 when n < 2 (single element)", () => {
    expect(calculatePearsonR([1], [2]).r).toBe(0);
  });

  it("should return r=0 for constant x values (zero variance)", () => {
    const result = calculatePearsonR([5, 5, 5], [1, 2, 3]);
    expect(result.r).toBe(0);
  });

  it("should return r=0 for constant y values (zero variance)", () => {
    const result = calculatePearsonR([1, 2, 3], [7, 7, 7]);
    expect(result.r).toBe(0);
  });

  it("should return r=0 when both arrays are constant", () => {
    const result = calculatePearsonR([3, 3, 3], [3, 3, 3]);
    expect(result.r).toBe(0);
  });

  it("should handle arrays of different length by truncating to shorter", () => {
    // [1,2,3] vs [2,4] → n=2, perfect positive correlation on [1,2] vs [2,4]
    const result = calculatePearsonR([1, 2, 3], [2, 4]);
    expect(result.r).toBeCloseTo(1.0, 10);
  });

  it("should clamp r to [-1, 1] range", () => {
    // Even with floating-point noise, result should be within bounds
    const result = calculatePearsonR([1, 2, 3, 4, 5], [10, 20, 30, 40, 50]);
    expect(result.r).toBeGreaterThanOrEqual(-1);
    expect(result.r).toBeLessThanOrEqual(1);
  });

  it("should compute a known moderate positive correlation", () => {
    // Known example: x=[1,2,3,4,5], y=[2,3,4,3,6]
    // Manual calculation: r ≈ 0.8
    const result = calculatePearsonR([1, 2, 3, 4, 5], [2, 3, 4, 3, 6]);
    expect(result.r).toBeGreaterThan(0.7);
    expect(result.r).toBeLessThan(0.95);
  });

  it("should work with n=2 (minimum valid case)", () => {
    const result = calculatePearsonR([0, 10], [0, 10]);
    expect(result.r).toBeCloseTo(1.0, 10);
  });

  it("should handle negative values", () => {
    const result = calculatePearsonR([-3, -2, -1], [-6, -4, -2]);
    expect(result.r).toBeCloseTo(1.0, 10);
  });
});

// ---------------------------------------------------------------------------
// calculatePartialR
// ---------------------------------------------------------------------------
describe("calculatePartialR", () => {
  it("should return partial correlation coefficient", () => {
    // If rAB=0.8, rAZ=0.5, rBZ=0.3 then:
    // numerator = 0.8 - 0.5*0.3 = 0.65
    // denom = sqrt((1-0.25)*(1-0.09)) = sqrt(0.75*0.91) ≈ 0.8261
    // result ≈ 0.65 / 0.8261 ≈ 0.7868
    const result = calculatePartialR(0.8, 0.5, 0.3);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(0.7868, 3);
  });

  it("should return null when denominator is zero (rAZ=1)", () => {
    // rAZ=1 means (1-1²)=0, denominator=0
    const result = calculatePartialR(0.5, 1.0, 0.5);
    expect(result).toBeNull();
  });

  it("should return null when denominator is zero (rBZ=1)", () => {
    const result = calculatePartialR(0.5, 0.5, 1.0);
    expect(result).toBeNull();
  });

  it("should return null when both control correlations are 1", () => {
    const result = calculatePartialR(1.0, 1.0, 1.0);
    expect(result).toBeNull();
  });

  it("should return null when rAZ=-1", () => {
    const result = calculatePartialR(0.5, -1.0, 0.5);
    expect(result).toBeNull();
  });

  it("should clamp result to [-1, 1]", () => {
    const result = calculatePartialR(0.9, 0.1, 0.1);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThanOrEqual(-1);
    expect(result!).toBeLessThanOrEqual(1);
  });

  it("should return 0 when rAB equals product rAZ*rBZ", () => {
    // rAB = rAZ * rBZ → partial r = 0
    const result = calculatePartialR(0.15, 0.5, 0.3);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(0, 10);
  });

  it("should handle all-zero correlations", () => {
    const result = calculatePartialR(0, 0, 0);
    expect(result).not.toBeNull();
    expect(result!).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildScatterData
// ---------------------------------------------------------------------------
describe("buildScatterData", () => {
  it("should match data points by areaCode", () => {
    const xData: RankValueWithArea[] = [
      { areaCode: "01000", areaName: "北海道", value: 10 },
      { areaCode: "13000", areaName: "東京都", value: 20 },
    ];
    const yData: RankValueWithArea[] = [
      { areaCode: "13000", areaName: "東京都", value: 200 },
      { areaCode: "01000", areaName: "北海道", value: 100 },
    ];

    const result = buildScatterData(xData, yData);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      areaCode: "01000",
      areaName: "北海道",
      x: 10,
      y: 100,
    });
    expect(result[1]).toEqual({
      areaCode: "13000",
      areaName: "東京都",
      x: 20,
      y: 200,
    });
  });

  it("should only include area codes present in both datasets", () => {
    const xData: RankValueWithArea[] = [
      { areaCode: "01000", areaName: "北海道", value: 10 },
      { areaCode: "02000", areaName: "青森県", value: 15 },
    ];
    const yData: RankValueWithArea[] = [
      { areaCode: "01000", areaName: "北海道", value: 100 },
      { areaCode: "13000", areaName: "東京都", value: 200 },
    ];

    const result = buildScatterData(xData, yData);

    expect(result).toHaveLength(1);
    expect(result[0].areaCode).toBe("01000");
  });

  it("should return empty array when no area codes match", () => {
    const xData: RankValueWithArea[] = [
      { areaCode: "01000", areaName: "北海道", value: 10 },
    ];
    const yData: RankValueWithArea[] = [
      { areaCode: "13000", areaName: "東京都", value: 200 },
    ];

    const result = buildScatterData(xData, yData);

    expect(result).toHaveLength(0);
  });

  it("should return empty array when both inputs are empty", () => {
    expect(buildScatterData([], [])).toHaveLength(0);
  });

  it("should use areaName from xData", () => {
    const xData: RankValueWithArea[] = [
      { areaCode: "01000", areaName: "X-Name", value: 1 },
    ];
    const yData: RankValueWithArea[] = [
      { areaCode: "01000", areaName: "Y-Name", value: 2 },
    ];

    const result = buildScatterData(xData, yData);

    expect(result[0].areaName).toBe("X-Name");
  });
});
