import { describe, it, expect } from "vitest";

import { toCompositionChartData } from "../toCompositionChartData";

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

describe("toCompositionChartData", () => {
  it("複数セグメントの年度別データを正しく集約する", () => {
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

    const result = toCompositionChartData(
      rawDataList,
      ["若年", "高齢"],
      ["#ff0000", "#0000ff"]
    );

    expect(result.trendData).toHaveLength(2);
    expect(result.trendData[0]).toMatchObject({
      category: "2020",
      label: "2020年",
      若年: 100,
      高齢: 200,
    });
    expect(result.trendData[1]).toMatchObject({
      category: "2021",
      label: "2021年",
      若年: 150,
      高齢: 250,
    });
    expect(result.series).toHaveLength(2);
    expect(result.series[0]).toEqual({ key: "若年", label: "若年", color: "#ff0000" });
    expect(result.series[1]).toEqual({ key: "高齢", label: "高齢", color: "#0000ff" });
    expect(result.unit).toBe("人");
    expect(result.latestYearLabel).toBe("2021年");
  });

  it("totalData がある場合にその他を算出する", () => {
    const rawDataList: StatsSchema[][] = [
      [{ ...baseRow, yearCode: "2020", yearName: "2020年", value: 30 }],
      [{ ...baseRow, yearCode: "2020", yearName: "2020年", value: 50 }],
    ];
    const totalData: StatsSchema[] = [
      { ...baseRow, yearCode: "2020", yearName: "2020年", value: 100 },
    ];

    const result = toCompositionChartData(
      rawDataList,
      ["A", "B"],
      ["#aaa", "#bbb"],
      totalData
    );

    expect(result.trendData[0]["その他"]).toBe(20);
    expect(result.series).toHaveLength(3);
    expect(result.series[2]).toEqual({ key: "その他", label: "その他", color: "#9ca3af" });
  });

  it("totalData のその他が負にならない", () => {
    const rawDataList: StatsSchema[][] = [
      [{ ...baseRow, yearCode: "2020", value: 80 }],
      [{ ...baseRow, yearCode: "2020", value: 50 }],
    ];
    const totalData: StatsSchema[] = [
      { ...baseRow, yearCode: "2020", value: 100 },
    ];

    const result = toCompositionChartData(
      rawDataList,
      ["A", "B"],
      ["#aaa", "#bbb"],
      totalData
    );

    expect(result.trendData[0]["その他"]).toBe(0);
  });

  it("空配列の場合", () => {
    const result = toCompositionChartData([], [], []);

    expect(result.trendData).toHaveLength(0);
    expect(result.series).toHaveLength(0);
    expect(result.unit).toBe("");
    expect(result.latestYearLabel).toBe("");
  });

  it("colors 省略時にデフォルトカラーを使用する", () => {
    const rawDataList: StatsSchema[][] = [
      [{ ...baseRow, yearCode: "2020", value: 100 }],
    ];

    const result = toCompositionChartData(rawDataList, ["テスト"], []);

    expect(result.series[0].color).toBe("#22c55e");
  });

  it("trendData が年度昇順にソートされる", () => {
    const rawDataList: StatsSchema[][] = [
      [
        { ...baseRow, yearCode: "2022", yearName: "2022年", value: 300 },
        { ...baseRow, yearCode: "2020", yearName: "2020年", value: 100 },
        { ...baseRow, yearCode: "2021", yearName: "2021年", value: 200 },
      ],
    ];

    const result = toCompositionChartData(rawDataList, ["値"], ["#000"]);

    expect(result.trendData.map((d) => d.category)).toEqual(["2020", "2021", "2022"]);
  });

  it("value が null の場合に 0 として扱う", () => {
    const rawDataList: StatsSchema[][] = [
      [{ ...baseRow, yearCode: "2020", value: null as unknown as number }],
    ];

    const result = toCompositionChartData(rawDataList, ["テスト"], ["#000"]);

    expect(result.trendData[0]["テスト"]).toBe(0);
  });
});
