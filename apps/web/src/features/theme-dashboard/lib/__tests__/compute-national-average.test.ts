import { describe, it, expect } from "vitest";

import { computeNationalAverage } from "../compute-national-average";

import type { RankingValue } from "@stats47/ranking";

const makeValue = (
  yearCode: string,
  value: number,
  areaCode = "13000",
): RankingValue =>
  ({
    yearCode,
    yearName: `${yearCode}年`,
    areaCode,
    areaName: "東京都",
    value,
    rank: 1,
  }) as RankingValue;

describe("computeNationalAverage", () => {
  it("年度別の平均値を正しく算出する", () => {
    const data = [
      makeValue("2020", 100, "13000"),
      makeValue("2020", 200, "27000"),
      makeValue("2021", 300, "13000"),
      makeValue("2021", 400, "27000"),
    ];

    const result = computeNationalAverage(data);

    expect(result.get("2020")).toEqual({ value: 150, yearName: "2020年" });
    expect(result.get("2021")).toEqual({ value: 350, yearName: "2021年" });
  });

  it("小数点の丸め（100倍して四捨五入）", () => {
    const data = [
      makeValue("2020", 10, "13000"),
      makeValue("2020", 20, "27000"),
      makeValue("2020", 30, "01000"),
    ];

    const result = computeNationalAverage(data);

    expect(result.get("2020")?.value).toBe(20);
  });

  it("空配列の場合に空 Map を返す", () => {
    const result = computeNationalAverage([]);
    expect(result.size).toBe(0);
  });

  it("単一データポイントの場合", () => {
    const data = [makeValue("2020", 42)];
    const result = computeNationalAverage(data);

    expect(result.get("2020")?.value).toBe(42);
  });
});
