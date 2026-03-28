import { describe, it, expect } from "vitest";

import { toMixedChartData } from "../toMixedChartData";

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

describe("toMixedChartData", () => {
  it("棒系列と折れ線系列をマージしたデータを返す", () => {
    const columnDataList: StatsSchema[][] = [
      [
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 500 },
        { ...baseRow, yearCode: "2021", yearName: "2021年", value: 600 },
      ],
    ];
    const lineDataList: StatsSchema[][] = [
      [
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 3.2 },
        { ...baseRow, yearCode: "2021", yearName: "2021年", value: 3.5 },
      ],
    ];

    const result = toMixedChartData(
      columnDataList,
      lineDataList,
      ["出生数"],
      ["出生率"],
      "人",
      "%"
    );

    expect(result.xAxisKey).toBe("year");
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      year: "2020年",
      yearCode: "2020",
      出生数: 500,
      出生率: 3.2,
    });
    expect(result.columns).toHaveLength(1);
    expect(result.columns[0].name).toBe("出生数");
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].name).toBe("出生率");
    expect(result.leftUnit).toBe("人");
    expect(result.rightUnit).toBe("%");
  });

  it("空データを処理できる", () => {
    const result = toMixedChartData([], [], [], []);
    expect(result.data).toHaveLength(0);
    expect(result.columns).toHaveLength(0);
    expect(result.lines).toHaveLength(0);
  });

  it("labels 省略時に categoryName からラベルを導出する", () => {
    const columnDataList: StatsSchema[][] = [
      [
        {
          ...baseRow,
          categoryName: "婚姻件数",
          yearCode: "2020",
          yearName: "2020年",
          value: 500,
        },
      ],
    ];
    const lineDataList: StatsSchema[][] = [
      [
        {
          ...baseRow,
          categoryName: "婚姻率",
          yearCode: "2020",
          yearName: "2020年",
          value: 4.3,
        },
      ],
    ];

    const result = toMixedChartData(columnDataList, lineDataList);

    expect(result.columns[0].name).toBe("婚姻件数");
    expect(result.lines[0].name).toBe("婚姻率");
    expect(result.data[0]).toMatchObject({ 婚姻件数: 500, 婚姻率: 4.3 });
  });

  it("年度コードで昇順ソートされる", () => {
    const columnDataList: StatsSchema[][] = [
      [
        { ...baseRow, yearCode: "2021", yearName: "2021年", value: 200 },
        { ...baseRow, yearCode: "2019", yearName: "2019年", value: 100 },
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 150 },
      ],
    ];

    const result = toMixedChartData(columnDataList, [], ["値"]);

    expect(result.data.map((d) => d.yearCode)).toEqual([
      "2019",
      "2020",
      "2021",
    ]);
  });
});
