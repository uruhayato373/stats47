import { describe, expect, it } from "vitest";

import { summarizeSampleCounts } from "../ranking-sample-count";

import type { RankingReferenceValue, RankingValue } from "@stats47/ranking";

const value = (areaCode: string, areaName: string, rank: number, sampleCount?: number): RankingValue => ({
  metricKey: "school-teacher-annual-income", areaCode, areaName, yearCode: "2021", yearName: "2021年",
  value: 700, unit: "万円", rank, ...(sampleCount === undefined ? {} : { sampleCount }),
});
const reference = (areaCode: string, areaName: string, yearCode: string, sampleCount: number): RankingReferenceValue => ({
  metricKey: "school-teacher-annual-income", areaCode, areaName, yearCode, yearName: `${yearCode}年`,
  value: 650, unit: "万円", sampleCount,
});

describe("summarizeSampleCounts (DATA-WAGE-TEACHER-COVERAGE-01)", () => {
  it("表示中の年の推計の人数の合計・最少の県と、その年の参考値だけを返す", () => {
    const summary = summarizeSampleCounts(
      [value("23000", "愛知県", 1, 2400), value("13000", "東京都", 2, 3100)],
      [reference("03000", "岩手県", "2021", 0), reference("03000", "岩手県", "2022", 5)],
      "2021",
    );
    expect(summary).toEqual({
      total: 5500,
      areaCount: 3,
      smallest: { areaName: "愛知県", sampleCount: 2400 },
      references: [expect.objectContaining({ areaCode: "03000", yearCode: "2021", sampleCount: 0 })],
    });
  });

  it("順位を付けた県の人数が取れない年は合計を出さず、参考値だけを返す", () => {
    const summary = summarizeSampleCounts([value("13000", "東京都", 1)], [reference("03000", "岩手県", "2021", 0)], "2021");
    expect(summary?.total).toBeNull();
    expect(summary?.references.map((v) => v.areaCode)).toEqual(["03000"]);
  });

  it("推計の人数を持たない指標では何も出さない", () => {
    expect(summarizeSampleCounts([value("13000", "東京都", 1)], [], "2021")).toBeNull();
  });
});
