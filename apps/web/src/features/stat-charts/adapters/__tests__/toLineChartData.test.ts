import { describe, it, expect } from "vitest";

import { toLineChartData } from "../toLineChartData";

import type { StatsSchema } from "@stats47/types";

const baseRow: StatsSchema = {
  metricKey: "A1101",
  areaCode: "13000",
  areaName: "東京都",
  yearCode: "2020",
  yearName: "2020年",
  value: 100,
  unit: "人",
};

describe("toLineChartData", () => {
  it("複数系列を年度でマージする", () => {
    const rawDataList: StatsSchema[][] = [
      [
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 100 },
        { ...baseRow, yearCode: "2021", yearName: "2021年", value: 150 },
      ],
      [
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 200 },
        { ...baseRow, yearCode: "2021", yearName: "2021年", value: 250 },
      ],
    ];
    const result = toLineChartData(rawDataList, ["系列A", "系列B"]);
    expect(result.xAxisKey).toBe("year");
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({ 系列A: 100, 系列B: 200 });
    expect(result.lines).toHaveLength(2);
  });

  it("labels 省略時に空ラベルを使用する", () => {
    const rawDataList: StatsSchema[][] = [
      [
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 100 },
        { ...baseRow, yearCode: "2021", yearName: "2021年", value: 150 },
      ],
    ];
    const result = toLineChartData(rawDataList);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].name).toBe("");
    expect(result.data).toHaveLength(2);
  });
});
