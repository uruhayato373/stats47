import { describe, it, expect } from "vitest";
import { toLineChartData } from "../toLineChartData";
import type { StatsSchema } from "@stats47/types";

const baseRow: StatsSchema = {
  areaCode: "13000",
  areaName: "東京都",
  yearCode: "2020",
  yearName: "2020年",
  categoryCode: "A1101",
  categoryName: "人口",
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

  it("labels 省略時に categoryName からラベルを導出する", () => {
    const rawDataList: StatsSchema[][] = [
      [
        {
          ...baseRow,
          categoryName: "出生数",
          yearCode: "2020",
          yearName: "2020年",
          value: 100,
        },
        {
          ...baseRow,
          categoryName: "出生数",
          yearCode: "2021",
          yearName: "2021年",
          value: 150,
        },
      ],
    ];
    const result = toLineChartData(rawDataList);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].name).toBe("出生数");
    expect(result.data).toHaveLength(2);
  });
});
