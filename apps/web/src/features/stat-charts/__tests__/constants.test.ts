import { describe, it, expect } from "vitest";

import { CHART_COLORS, getChartColor } from "../constants";

describe("CHART_COLORS", () => {
  it("5色のカラーパレットが定義されている", () => {
    expect(CHART_COLORS).toHaveLength(5);
  });

  it("全ての色が hsl(var(--chart-*)) 形式", () => {
    for (const color of CHART_COLORS) {
      expect(color).toMatch(/^hsl\(var\(--chart-\d\)\)$/);
    }
  });
});

describe("getChartColor", () => {
  it("インデックス 0 で最初の色を返す", () => {
    expect(getChartColor(0)).toBe(CHART_COLORS[0]);
  });

  it("インデックス 4 で最後の色を返す", () => {
    expect(getChartColor(4)).toBe(CHART_COLORS[4]);
  });

  it("インデックス 5 で循環して最初の色を返す", () => {
    expect(getChartColor(5)).toBe(CHART_COLORS[0]);
  });

  it("大きなインデックスでも循環する", () => {
    expect(getChartColor(13)).toBe(CHART_COLORS[3]);
  });
});
