import { describe, it, expect } from "vitest";

import { toKpiCardData } from "../toKpiCardData";

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

describe("toKpiCardData", () => {
  it("最新値と前年比（増加）を返す", () => {
    const rawData: StatsSchema[] = [
      { ...baseRow, yearCode: "2020", yearName: "2020年", value: 1000 },
      { ...baseRow, yearCode: "2021", yearName: "2021年", value: 1100 },
    ];

    const result = toKpiCardData(rawData);

    // 最新年度（降順で 2021 が先頭）
    expect(result.value).toBe(1100);
    expect(result.unit).toBe("人");
    expect(result.year).toBe("2021年");
    expect(result.changeRate).toBe(10);
    expect(result.changeDirection).toBe("increase");
  });

  it("空データの場合は全て null を返す", () => {
    const result = toKpiCardData([]);

    expect(result.value).toBeNull();
    expect(result.unit).toBeNull();
    expect(result.year).toBeNull();
    expect(result.changeRate).toBeNull();
    expect(result.changeDirection).toBeNull();
  });

  it("前年比が減少の場合 decrease を返す", () => {
    const rawData: StatsSchema[] = [
      { ...baseRow, yearCode: "2020", yearName: "2020年", value: 200 },
      { ...baseRow, yearCode: "2021", yearName: "2021年", value: 180 },
    ];

    const result = toKpiCardData(rawData);

    expect(result.value).toBe(180);
    expect(result.changeRate).toBe(-10);
    expect(result.changeDirection).toBe("decrease");
  });

  it("1年分のみの場合は前年比が null", () => {
    const rawData: StatsSchema[] = [
      { ...baseRow, yearCode: "2021", yearName: "2021年", value: 500 },
    ];

    const result = toKpiCardData(rawData);

    expect(result.value).toBe(500);
    expect(result.changeRate).toBeNull();
    expect(result.changeDirection).toBeNull();
  });
});
