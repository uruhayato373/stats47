import { describe, it, expect } from "vitest";

import { toStatsTableData } from "../toStatsTableData";

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

describe("toStatsTableData", () => {
  it("複数行の時系列データからテーブルデータを生成する", () => {
    const rawDataList: StatsSchema[][] = [
      [
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 1400 },
        { ...baseRow, yearCode: "2021", yearName: "2021年", value: 1380 },
      ],
      [
        {
          ...baseRow,
          yearCode: "2020",
          yearName: "2020年",
          value: 84,
          unit: "万人",
          categoryName: "出生数",
        },
        {
          ...baseRow,
          yearCode: "2021",
          yearName: "2021年",
          value: 81,
          unit: "万人",
          categoryName: "出生数",
        },
      ],
    ];
    const rowDefs = [
      { label: "人口" },
      { label: "出生数", rankingLink: "/ranking/births" },
    ];

    const result = toStatsTableData(rawDataList, rowDefs);

    // years は降順（extractYearsFromStats の仕様）
    expect(result.years).toHaveLength(2);
    expect(result.years[0].yearCode).toBe("2021");
    expect(result.years[1].yearCode).toBe("2020");

    // 各年度の行データ
    const year2021 = result.dataByYear["2021"];
    expect(year2021).toHaveLength(2);
    expect(year2021[0]).toMatchObject({ label: "人口", value: 1380 });
    expect(year2021[1]).toMatchObject({
      label: "出生数",
      value: 81,
      rankingLink: "/ranking/births",
    });
  });

  it("空データの場合は空の years と dataByYear を返す", () => {
    const result = toStatsTableData([], []);
    expect(result.years).toHaveLength(0);
    expect(result.dataByYear).toEqual({});
  });

  it("特定の年度にデータがない行は value: null を返す", () => {
    const rawDataList: StatsSchema[][] = [
      [{ ...baseRow, yearCode: "2020", yearName: "2020年", value: 100 }],
      // 2行目は 2020 年のデータがない
      [{ ...baseRow, yearCode: "2021", yearName: "2021年", value: 50 }],
    ];
    const rowDefs = [{ label: "行A" }, { label: "行B" }];

    const result = toStatsTableData(rawDataList, rowDefs);

    // 2020 年の行B はデータなし
    const year2020 = result.dataByYear["2020"];
    expect(year2020[0].value).toBe(100);
    expect(year2020[1].value).toBeNull();

    // 2021 年の行A はデータなし
    const year2021 = result.dataByYear["2021"];
    expect(year2021[0].value).toBeNull();
    expect(year2021[1].value).toBe(50);
  });
});
