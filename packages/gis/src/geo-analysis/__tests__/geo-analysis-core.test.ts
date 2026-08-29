import { describe, expect, test } from "vitest";

import {
  haversineKilometers,
  median,
  pointInMultiPolygon,
  rankAreaRows,
} from "../geo-analysis-core";

describe("geo analysis core", () => {
  test("中央値を奇数件と偶数件で決定的に計算する", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBe(0);
  });

  test("同値は同順位にし、地域コードで順序を安定化する", () => {
    const rows = rankAreaRows(
      [
        { areaCode: "02000", areaName: "B", values: { value: 10 } },
        { areaCode: "01000", areaName: "A", values: { value: 10 } },
        { areaCode: "03000", areaName: "C", values: { value: 5 } },
      ],
      "value",
    );
    expect(rows.map((row) => [row.areaCode, row.rank])).toEqual([
      ["01000", 1],
      ["02000", 1],
      ["03000", 3],
    ]);
  });

  test("800m圏の境界判定に使う距離をkmで返す", () => {
    expect(haversineKilometers([139.7, 35.6], [139.7, 35.6072])).toBeCloseTo(
      0.8,
      1,
    );
  });

  test("穴を含むポリゴンとマルチポリゴンを判定する", () => {
    const polygons = [
      [
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4],
          [0, 0],
        ],
        [
          [1, 1],
          [2, 1],
          [2, 2],
          [1, 2],
          [1, 1],
        ],
      ],
    ] as const;
    expect(pointInMultiPolygon([3, 3], polygons)).toBe(true);
    expect(pointInMultiPolygon([1.5, 1.5], polygons)).toBe(false);
    expect(pointInMultiPolygon([5, 5], polygons)).toBe(false);
  });
});
