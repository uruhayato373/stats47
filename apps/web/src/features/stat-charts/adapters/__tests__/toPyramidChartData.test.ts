import { describe, it, expect } from "vitest";

import { toPyramidChartData } from "../toPyramidChartData";

import type { StatsSchema } from "@stats47/types";

const baseRow: StatsSchema = {
  areaCode: "13000",
  areaName: "東京都",
  yearCode: "2020",
  yearName: "2020年",
  categoryCode: "A1101",
  categoryName: "0～4歳人口（男）",
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
        {
          ...baseRow,
          categoryName: "5～9歳人口（男）",
          yearCode: "2019",
          yearName: "2019年",
          value: 270,
        },
        {
          ...baseRow,
          categoryName: "5～9歳人口（男）",
          yearCode: "2020",
          yearName: "2020年",
          value: 280,
        },
      ],
    ];
    const femaleDataList: StatsSchema[][] = [
      [
        {
          ...baseRow,
          categoryName: "0～4歳人口（女）",
          yearCode: "2019",
          yearName: "2019年",
          value: 240,
        },
        {
          ...baseRow,
          categoryName: "0～4歳人口（女）",
          yearCode: "2020",
          yearName: "2020年",
          value: 250,
        },
      ],
      [
        {
          ...baseRow,
          categoryName: "5～9歳人口（女）",
          yearCode: "2019",
          yearName: "2019年",
          value: 260,
        },
        {
          ...baseRow,
          categoryName: "5～9歳人口（女）",
          yearCode: "2020",
          yearName: "2020年",
          value: 270,
        },
      ],
    ];

    const result = toPyramidChartData(maleDataList, femaleDataList);

    expect(result).toHaveLength(2);
    // 最新年度（配列末尾）のデータを使用
    expect(result[0]).toMatchObject({
      ageGroup: "0～4歳",
      male: -260, // 男性は負の値
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
      [{ ...baseRow, categoryName: "0～4歳人口（女）", value: 90 }],
    ];

    const result = toPyramidChartData(maleDataList, femaleDataList, [
      "0-4歳",
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].ageGroup).toBe("0-4歳");
  });

  it("100歳以上パターンのカテゴリ名からも年齢階級を抽出する", () => {
    const maleDataList: StatsSchema[][] = [
      [{ ...baseRow, categoryName: "100歳以上人口（男）", value: 5 }],
    ];
    const femaleDataList: StatsSchema[][] = [
      [{ ...baseRow, categoryName: "100歳以上人口（女）", value: 10 }],
    ];

    const result = toPyramidChartData(maleDataList, femaleDataList);

    expect(result[0].ageGroup).toBe("100歳以上");
    expect(result[0].male).toBe(-5);
    expect(result[0].female).toBe(10);
  });
});
