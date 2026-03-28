import {
  findRankingItemByKey,
  findLatestYear,
  listRankingValues,
} from "@stats47/ranking/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@stats47/ranking/server");

import { fetchRankingTableDataAction } from "../fetch-ranking-table-data";

import type { RankingItem, RankingValue } from "@stats47/ranking";

const mockFindRankingItemByKey = vi.mocked(findRankingItemByKey);
const mockFindLatestYear = vi.mocked(findLatestYear);
const mockListRankingValues = vi.mocked(listRankingValues);

const mockRankingItem = {
  rankingKey: "population",
  rankingName: "人口",
  areaType: "prefecture" as const,
  unit: "人",
  latestYear: { yearCode: "2024", yearName: "2024年度" },
} as RankingItem;

const mockValues = [
  { areaCode: "13000", areaName: "東京都", value: 14000000, rank: 1 },
] as RankingValue[];

describe("fetchRankingTableDataAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("yearCode 指定ありで正常にデータを取得できる", async () => {
    mockFindRankingItemByKey.mockResolvedValue({
      success: true,
      data: mockRankingItem,
    });
    mockListRankingValues.mockResolvedValue({
      success: true,
      data: mockValues,
    });

    const result = await fetchRankingTableDataAction("population", "2023");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.yearCode).toBe("2023");
      expect(result.data.rankingValues).toEqual(mockValues);
      expect(result.data.rankingItem).toEqual(mockRankingItem);
    }
    expect(mockFindLatestYear).not.toHaveBeenCalled();
  });

  it("yearCode 未指定時は latestYear オブジェクトから年度を取得する", async () => {
    mockFindRankingItemByKey.mockResolvedValue({
      success: true,
      data: mockRankingItem,
    });
    mockListRankingValues.mockResolvedValue({
      success: true,
      data: mockValues,
    });

    const result = await fetchRankingTableDataAction("population");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.yearCode).toBe("2024");
      expect(result.data.yearName).toBe("2024年度");
    }
  });

  it("latestYear が JSON 文字列の場合もパースして年度を取得する", async () => {
    const itemWithStringYear = {
      ...mockRankingItem,
      latestYear: JSON.stringify({ yearCode: "2022", yearName: "2022年度" }),
    } as unknown as RankingItem;
    mockFindRankingItemByKey.mockResolvedValue({
      success: true,
      data: itemWithStringYear,
    });
    mockListRankingValues.mockResolvedValue({
      success: true,
      data: mockValues,
    });

    const result = await fetchRankingTableDataAction("population");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.yearCode).toBe("2022");
    }
  });

  it("latestYear が不正な JSON の場合は findLatestYear にフォールバックする", async () => {
    const itemWithBadYear = {
      ...mockRankingItem,
      latestYear: "invalid-json",
    } as unknown as RankingItem;
    mockFindRankingItemByKey.mockResolvedValue({
      success: true,
      data: itemWithBadYear,
    });
    mockFindLatestYear.mockResolvedValue({
      success: true,
      data: "2021",
    });
    mockListRankingValues.mockResolvedValue({
      success: true,
      data: mockValues,
    });

    const result = await fetchRankingTableDataAction("population");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.yearCode).toBe("2021");
    }
    expect(mockFindLatestYear).toHaveBeenCalledWith("prefecture");
  });

  it("latestYear が null で findLatestYear も失敗する場合は空の結果を返す", async () => {
    const itemWithoutYear = {
      ...mockRankingItem,
      latestYear: null,
    } as RankingItem;
    mockFindRankingItemByKey.mockResolvedValue({
      success: true,
      data: itemWithoutYear,
    });
    mockFindLatestYear.mockResolvedValue({
      success: false,
      error: new Error("not found"),
    });

    const result = await fetchRankingTableDataAction("population");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rankingValues).toEqual([]);
      expect(result.data.yearCode).toBeNull();
      expect(result.data.yearName).toBeNull();
    }
  });

  it("ランキング項目が見つからない場合はエラーを返す", async () => {
    mockFindRankingItemByKey.mockResolvedValue({
      success: false,
      error: new Error("not found"),
    });

    const result = await fetchRankingTableDataAction("nonexistent");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ランキング項目が見つかりませんでした");
    }
  });

  it("listRankingValues が失敗した場合はエラーを返す", async () => {
    mockFindRankingItemByKey.mockResolvedValue({
      success: true,
      data: mockRankingItem,
    });
    mockListRankingValues.mockResolvedValue({
      success: false,
      error: new Error("DB error"),
    });

    const result = await fetchRankingTableDataAction("population", "2024");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("DB error");
    }
  });

  it("予期しない例外が発生した場合はエラーを返す", async () => {
    mockFindRankingItemByKey.mockRejectedValue(new Error("unexpected"));

    const result = await fetchRankingTableDataAction("population");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("データの取得中にエラーが発生しました");
    }
  });
});
