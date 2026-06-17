import { describe, it, expect } from "vitest";

import { toPyramidChartData } from "../toPyramidChartData";

import type { StatsSchema } from "@stats47/types";

const baseRow: StatsSchema = {
  metricKey: "A1101",
  areaCode: "13000",
  areaName: "東京都",
  yearCode: "2020",
  yearName: "2020年",
  value: 100,
  unit: "千人",
};

describe("toPyramidChartData", () => {
  it("男女の年齢階級別データをピラミッドチャート用に変換する", () => {
    const maleDataList: StatsSchema[][] = [
      [
        { ...baseRow, yearCode: "2019", yearName: "2019年", value: 250 },
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 260 },
      ],
      [
        { ...baseRow, yearCode: "2019", yearName: "2019年", value: 270 },
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 280 },
      ],
    ];
    const femaleDataList: StatsSchema[][] = [
      [
        { ...baseRow, yearCode: "2019", yearName: "2019年", value: 240 },
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 250 },
      ],
      [
        { ...baseRow, yearCode: "2019", yearName: "2019年", value: 260 },
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 270 },
      ],
    ];

    const result = toPyramidChartData(maleDataList, femaleDataList, ["0～4歳", "5～9歳"]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      ageGroup: "0～4歳",
      male: -260,
      female: 250,
    });
    expect(result[1]).toMatchObject({
      ageGroup: "5～9歳",
      male: -280,
      female: 270,
    });
  });

  it("空データの場合は空配列を返す", () => {
    const result = toPyramidChartData([], []);
    expect(result).toHaveLength(0);
  });

  it("ageGroups を明示的に指定できる", () => {
    const maleDataList: StatsSchema[][] = [
      [{ ...baseRow, value: 100 }],
    ];
    const femaleDataList: StatsSchema[][] = [
      [{ ...baseRow, value: 90 }],
    ];

    const result = toPyramidChartData(maleDataList, femaleDataList, ["0-4歳"]);

    expect(result).toHaveLength(1);
    expect(result[0].ageGroup).toBe("0-4歳");
  });

  it("ageGroups 省略時はインデックスをラベルとして使用する", () => {
    const maleDataList: StatsSchema[][] = [
      [{ ...baseRow, value: 5 }],
    ];
    const femaleDataList: StatsSchema[][] = [
      [{ ...baseRow, value: 10 }],
    ];

    const result = toPyramidChartData(maleDataList, femaleDataList);

    expect(result[0].ageGroup).toBe("0");
    expect(result[0].male).toBe(-5);
    expect(result[0].female).toBe(10);
  });
});
