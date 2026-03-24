import { describe, expect, it } from "vitest";

import { computeDeviationScores } from "../compute-deviation-scores";

describe("computeDeviationScores", () => {
  it("空配列は空配列を返す", () => {
    expect(computeDeviationScores([])).toEqual([]);
  });

  it("平均値は偏差値50になる", () => {
    const values = [10, 20, 30, 40, 50];
    const scores = computeDeviationScores(values);
    // mean = 30 の値は偏差値 50
    expect(scores[2]).toBeCloseTo(50, 5);
  });

  it("平均より高い値は偏差値50以上", () => {
    const values = [10, 20, 30, 40, 50];
    const scores = computeDeviationScores(values);
    expect(scores[4]!).toBeGreaterThan(50);
  });

  it("平均より低い値は偏差値50以下", () => {
    const values = [10, 20, 30, 40, 50];
    const scores = computeDeviationScores(values);
    expect(scores[0]!).toBeLessThan(50);
  });

  it("全値同一の場合は全て偏差値50", () => {
    const values = [100, 100, 100];
    const scores = computeDeviationScores(values);
    expect(scores).toEqual([50, 50, 50]);
  });

  it("入力と同じ長さの配列を返す", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const scores = computeDeviationScores(values);
    expect(scores).toHaveLength(values.length);
  });

  it("偏差値の平均は50に近い", () => {
    const values = [15, 25, 35, 45, 55, 65, 75];
    const scores = computeDeviationScores(values) as number[];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(avg).toBeCloseTo(50, 5);
  });
});
