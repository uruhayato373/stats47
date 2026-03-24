import { describe, expect, it } from "vitest";
import type { RankingItemCounts } from "../../types";
import { extractRankingStatsByAreaType } from "../extract-ranking-stats";

describe("extractRankingStatsByAreaType", () => {
  const mockStats: RankingItemCounts[] = [
    { areaType: "prefecture", total: 47, active: 47, inactive: 0 },
    { areaType: "city", total: 1741, active: 1700, inactive: 41 },
  ];

  it("指定した地域タイプの統計を抽出できること", () => {
    const result = extractRankingStatsByAreaType(mockStats, "prefecture");
    expect(result).toBeDefined();
    expect(result?.areaType).toBe("prefecture");
    expect(result?.total).toBe(47);
  });

  it("存在しない地域タイプを指定した場合、undefined を返すこと", () => {
    const result = extractRankingStatsByAreaType(mockStats, "country");
    expect(result).toBeUndefined();
  });

  it("空配列の場合、undefined を返すこと", () => {
    expect(extractRankingStatsByAreaType([], "prefecture")).toBeUndefined();
  });
});
