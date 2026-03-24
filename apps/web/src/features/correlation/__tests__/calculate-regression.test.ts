import { describe, expect, it } from "vitest";

import { calculateRegression } from "../utils/calculate-regression";

describe("calculateRegression", () => {
  it("データが 2 点未満の場合は slope=0, intercept=0 を返す", () => {
    expect(calculateRegression([])).toEqual({ slope: 0, intercept: 0 });
    expect(calculateRegression([{ x: 1, y: 2 }])).toEqual({ slope: 0, intercept: 0 });
  });

  it("完全な線形データで正しい回帰係数を返す", () => {
    // y = 2x + 1
    const data = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ];
    const result = calculateRegression(data);
    expect(result.slope).toBeCloseTo(2, 10);
    expect(result.intercept).toBeCloseTo(1, 10);
  });

  it("全ての x が同じ場合（denom=0）は slope=0, intercept=平均y を返す", () => {
    const data = [
      { x: 5, y: 10 },
      { x: 5, y: 20 },
      { x: 5, y: 30 },
    ];
    const result = calculateRegression(data);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBeCloseTo(20, 10);
  });

  it("負の傾きを正しく計算する", () => {
    // y = -x + 10
    const data = [
      { x: 0, y: 10 },
      { x: 5, y: 5 },
      { x: 10, y: 0 },
    ];
    const result = calculateRegression(data);
    expect(result.slope).toBeCloseTo(-1, 10);
    expect(result.intercept).toBeCloseTo(10, 10);
  });
});
