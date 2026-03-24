import { describe, expect, it } from "vitest";

import type { RankingValue } from "@stats47/ranking";

/** computeYearlyAverages のロジックを再現（TrendSparklineCard から抽出） */
function computeYearlyAverages(values: RankingValue[]) {
  const byYear = new Map<string, { yearName: string; sum: number; count: number }>();
  for (const v of values) {
    if (v.areaCode === "00000") continue;
    const entry = byYear.get(v.yearCode);
    if (entry) {
      entry.sum += v.value;
      entry.count++;
    } else {
      byYear.set(v.yearCode, { yearName: v.yearName, sum: v.value, count: 1 });
    }
  }
  return [...byYear.entries()]
    .map(([yearCode, { yearName, sum, count }]) => ({
      yearCode,
      yearName,
      average: sum / count,
    }))
    .sort((a, b) => a.yearCode.localeCompare(b.yearCode));
}

const makeValue = (areaCode: string, yearCode: string, value: number): RankingValue => ({
  areaCode,
  areaName: `Area${areaCode}`,
  yearCode,
  yearName: `${yearCode.slice(0, 4)}年`,
  value,
  rank: 1,
  unit: "人",
  categoryCode: "test",
  categoryName: "テスト",
});

describe("computeYearlyAverages", () => {
  it("全国データ（00000）を除外する", () => {
    const values = [
      makeValue("00000", "2020", 1000),
      makeValue("13000", "2020", 100),
      makeValue("14000", "2020", 200),
    ];
    const result = computeYearlyAverages(values);
    expect(result).toHaveLength(1);
    expect(result[0].average).toBe(150); // (100+200)/2, not including 1000
  });

  it("年度ごとに正しい平均を計算する", () => {
    const values = [
      makeValue("13000", "2020", 100),
      makeValue("14000", "2020", 200),
      makeValue("13000", "2021", 150),
      makeValue("14000", "2021", 250),
    ];
    const result = computeYearlyAverages(values);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ yearCode: "2020", yearName: "2020年", average: 150 });
    expect(result[1]).toEqual({ yearCode: "2021", yearName: "2021年", average: 200 });
  });

  it("年度コード順にソートされる", () => {
    const values = [
      makeValue("13000", "2022", 300),
      makeValue("13000", "2020", 100),
      makeValue("13000", "2021", 200),
    ];
    const result = computeYearlyAverages(values);
    expect(result.map((r) => r.yearCode)).toEqual(["2020", "2021", "2022"]);
  });

  it("空配列は空配列を返す", () => {
    expect(computeYearlyAverages([])).toEqual([]);
  });

  it("全国データのみの場合は空配列を返す", () => {
    const values = [makeValue("00000", "2020", 1000)];
    expect(computeYearlyAverages(values)).toEqual([]);
  });
});
