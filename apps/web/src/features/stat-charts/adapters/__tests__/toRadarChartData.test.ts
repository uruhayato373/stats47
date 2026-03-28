import { describe, it, expect } from "vitest";

import { toRadarChartData } from "../toRadarChartData";

describe("toRadarChartData", () => {
  it("軸定義と系列データからレーダーチャートデータを生成する", () => {
    const axesDef = [
      { key: "economy", label: "経済", max: 100 },
      { key: "health", label: "健康", max: 100 },
      { key: "education", label: "教育", max: 100 },
    ];
    const seriesData = [
      {
        label: "東京都",
        values: { economy: 80, health: 70, education: 90 },
      },
      {
        label: "大阪府",
        values: { economy: 75, health: 65, education: 85 },
        color: "#ff0000",
      },
    ];

    const result = toRadarChartData(axesDef, seriesData);

    expect(result.axes).toHaveLength(3);
    expect(result.axes[0]).toMatchObject({
      key: "economy",
      label: "経済",
      max: 100,
    });
    expect(result.data).toHaveLength(2);
    expect(result.data[0].label).toBe("東京都");
    expect(result.data[0].values).toMatchObject({
      economy: 80,
      health: 70,
      education: 90,
    });
    expect(result.data[1].color).toBe("#ff0000");
  });

  it("空データを処理できる", () => {
    const result = toRadarChartData([], []);
    expect(result.axes).toHaveLength(0);
    expect(result.data).toHaveLength(0);
  });

  it("max 省略時にデフォルト 100 を設定する", () => {
    const axesDef = [{ key: "population", label: "人口" }];
    const seriesData = [
      { label: "東京都", values: { population: 65 } },
    ];

    const result = toRadarChartData(axesDef, seriesData);

    expect(result.axes[0].max).toBe(100);
  });

  it("color 省略時にカラーパレットから自動割当する", () => {
    const axesDef = [{ key: "a", label: "A" }];
    const seriesData = [
      { label: "系列1", values: { a: 50 } },
      { label: "系列2", values: { a: 60 } },
    ];

    const result = toRadarChartData(axesDef, seriesData);

    expect(result.data[0].color).toBeDefined();
    expect(result.data[1].color).toBeDefined();
    expect(result.data[0].color).not.toBe(result.data[1].color);
  });
});
