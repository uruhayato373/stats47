import { describe, it, expect } from "vitest";

import { toStackedAreaData } from "../toStackedAreaData";

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

describe("toStackedAreaData", () => {
  it("複数系列の時系列データを積み上げ面グラフ用に変換する", () => {
    const rawDataList: StatsSchema[][] = [
      [
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 300 },
        { ...baseRow, yearCode: "2021", yearName: "2021年", value: 350 },
      ],
      [
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 200 },
        { ...baseRow, yearCode: "2021", yearName: "2021年", value: 250 },
      ],
    ];

    const result = toStackedAreaData(rawDataList, ["第一次産業", "第二次産業"]);

    expect(result.categoryKey).toBe("category");
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      category: "2020",
      label: "2020年",
      第一次産業: 300,
      第二次産業: 200,
    });
    expect(result.series).toHaveLength(2);
    expect(result.series[0]).toMatchObject({
      key: "第一次産業",
      label: "第一次産業",
    });
    expect(result.series[0].color).toBeDefined();
    expect(result.unit).toBe("人");
  });

  it("空データを処理できる", () => {
    const result = toStackedAreaData([], []);
    expect(result.data).toHaveLength(0);
    expect(result.series).toHaveLength(0);
  });

  it("labels 省略時に categoryName からラベルを導出する", () => {
    const rawDataList: StatsSchema[][] = [
      [
        {
          ...baseRow,
          categoryName: "農業",
          yearCode: "2020",
          yearName: "2020年",
          value: 100,
        },
      ],
      [
        {
          ...baseRow,
          categoryName: "工業",
          yearCode: "2020",
          yearName: "2020年",
          value: 200,
        },
      ],
    ];

    const result = toStackedAreaData(rawDataList);

    expect(result.series).toHaveLength(2);
    expect(result.series[0].key).toBe("農業");
    expect(result.series[1].key).toBe("工業");
  });

  it("年度コードで昇順ソートされる", () => {
    const rawDataList: StatsSchema[][] = [
      [
        { ...baseRow, yearCode: "2022", yearName: "2022年", value: 300 },
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 100 },
        { ...baseRow, yearCode: "2021", yearName: "2021年", value: 200 },
      ],
    ];

    const result = toStackedAreaData(rawDataList, ["系列A"]);

    expect(result.data.map((d) => d.category)).toEqual([
      "2020",
      "2021",
      "2022",
    ]);
  });
});
