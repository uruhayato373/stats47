import { describe, it, expect } from "vitest";

import { calculateRegression } from "../calculate-regression";

describe("calculateRegression", () => {
  it("完全な正の線形関係（y = 2x + 1）", () => {
    const data = [
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ];
    const { slope, intercept } = calculateRegression(data);
    expect(slope).toBeCloseTo(2, 10);
    expect(intercept).toBeCloseTo(1, 10);
  });

  it("データが1点の場合に slope=0 を返す", () => {
    const { slope, intercept } = calculateRegression([{ x: 5, y: 10 }]);
    expect(slope).toBe(0);
    expect(intercept).toBe(0);
  });

  it("空配列の場合に slope=0 を返す", () => {
    const { slope, intercept } = calculateRegression([]);
    expect(slope).toBe(0);
    expect(intercept).toBe(0);
  });

  it("x が全て同じ場合に slope=0, intercept=平均 を返す", () => {
    const data = [
      { x: 5, y: 10 },
      { x: 5, y: 20 },
    ];
    const { slope, intercept } = calculateRegression(data);
    expect(slope).toBe(0);
    expect(intercept).toBe(15);
  });

  it("負の傾きを正しく計算する", () => {
    const data = [
      { x: 0, y: 10 },
      { x: 10, y: 0 },
    ];
    const { slope, intercept } = calculateRegression(data);
    expect(slope).toBeCloseTo(-1, 10);
    expect(intercept).toBeCloseTo(10, 10);
  });
});
