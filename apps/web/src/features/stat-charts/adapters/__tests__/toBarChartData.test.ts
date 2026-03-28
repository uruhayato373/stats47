import { describe, it, expect } from "vitest";

import {
  toBarChartData,
  toStackedBarChartData,
} from "../toBarChartData";

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

describe("toStackedBarChartData", () => {
  it("複数系列の時系列データをマージして返す", () => {
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
    const result = toStackedBarChartData(rawDataList, ["系列A", "系列B"]);
    expect(result.categoryKey).toBe("year");
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      year: "2020年",
      yearCode: "2020",
      系列A: 100,
      系列B: 200,
    });
    expect(result.series).toHaveLength(2);
  });
});

describe("toBarChartData", () => {
  it("chartType stacked-bar で積み上げデータを返す", () => {
    const rawDataList: StatsSchema[][] = [
      [{ ...baseRow, yearCode: "2020", yearName: "2020年", value: 100 }],
      [{ ...baseRow, yearCode: "2020", yearName: "2020年", value: 200 }],
    ];
    const result = toBarChartData(rawDataList, ["A", "B"], "stacked-bar");
    expect(result.categoryKey).toBe("year");
    expect(result.data).toHaveLength(1);
  });

  it("空データを処理できる", () => {
    const result = toStackedBarChartData([], []);
    expect(result.data).toHaveLength(0);
    expect(result.series).toHaveLength(0);
  });

  it("labels 省略時に categoryName からラベルを導出する", () => {
    const rawDataList: StatsSchema[][] = [
      [
        {
          ...baseRow,
          categoryName: "持ち家",
          yearCode: "2020",
          yearName: "2020年",
          value: 100,
        },
      ],
      [
        {
          ...baseRow,
          categoryName: "借家",
          yearCode: "2020",
          yearName: "2020年",
          value: 200,
        },
      ],
    ];
    const result = toBarChartData(rawDataList, undefined, "stacked-bar");
    expect(result.series).toHaveLength(2);
    expect(result.series[0].name).toBe("持ち家");
    expect(result.series[1].name).toBe("借家");
  });
});
