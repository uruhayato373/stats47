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

  // 2026-10-30: 全国の値が無い系列が、線の無いまま凡例にだけ出ていた (ランキングの「労働市場指標の推移」の充足率)
  it("値が 1 つも無い系列は線も凡例も出さず、残りの色は元の並び順のまま", () => {
    const rawDataList: StatsSchema[][] = [
      [{ ...baseRow, value: 1 }],
      [],
      [{ ...baseRow, value: 3 }],
    ];
    const result = toLineChartData(rawDataList, ["A", "B", "C"], ["#a", "#b", "#c"]);
    expect(result.lines.map((line) => [line.name, line.color])).toEqual([
      ["A", "#a"],
      ["C", "#c"],
    ]);
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

  it("設定単位を優先し、未設定なら観測値の単位を引き継ぐ", () => {
    const rawDataList = [[baseRow]];
    expect(toLineChartData(rawDataList).unit).toBe("人");
    expect(toLineChartData(rawDataList, undefined, undefined, "万人").unit).toBe("万人");
  });
});
