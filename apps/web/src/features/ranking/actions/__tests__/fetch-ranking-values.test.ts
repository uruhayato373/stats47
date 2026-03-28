import {
  findRankingItem,
  listRankingValues,
  computeNormalization,
} from "@stats47/ranking/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@stats47/ranking/server");

import { fetchRankingValuesAction } from "../fetch-ranking-values";

import type { RankingItem, RankingValue } from "@stats47/ranking";

const mockFindRankingItem = vi.mocked(findRankingItem);
const mockListRankingValues = vi.mocked(listRankingValues);
const mockComputeNormalization = vi.mocked(computeNormalization);

const mockRankingItem = {
  rankingKey: "population",
  rankingName: "人口",
  areaType: "prefecture" as const,
  unit: "人",
} as RankingItem;

const mockValues = [
  { areaCode: "13000", areaName: "東京都", value: 14000000, rank: 1 },
  { areaCode: "27000", areaName: "大阪府", value: 8800000, rank: 2 },
] as RankingValue[];

describe("fetchRankingValuesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("通常のランキング値を取得できる", async () => {
    mockFindRankingItem.mockResolvedValue({
      success: true,
      data: mockRankingItem,
    });
    mockListRankingValues.mockResolvedValue({
      success: true,
      data: mockValues,
    });

    const result = await fetchRankingValuesAction(
      "population",
      "prefecture",
      "2024"
    );

    expect(result.success).toBe(true);
    expect(mockFindRankingItem).toHaveBeenCalledWith("population", "prefecture");
    expect(mockListRankingValues).toHaveBeenCalledWith(
      "population",
      "prefecture",
      "2024"
    );
    expect(mockComputeNormalization).not.toHaveBeenCalled();
  });

  it("正規化タイプ指定時は computeNormalization を呼ぶ", async () => {
    mockFindRankingItem.mockResolvedValue({
      success: true,
      data: mockRankingItem,
    });
    mockComputeNormalization.mockResolvedValue(mockValues);

    const result = await fetchRankingValuesAction(
      "population",
      "prefecture",
      "2024",
      "per_population"
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockValues);
    }
    expect(mockComputeNormalization).toHaveBeenCalledWith(
      mockRankingItem,
      "2024",
      "per_population"
    );
    expect(mockListRankingValues).not.toHaveBeenCalled();
  });

  it("ランキング項目が見つからない場合はエラーを返す", async () => {
    mockFindRankingItem.mockResolvedValue({
      success: false,
      error: new Error("not found"),
    });

    const result = await fetchRankingValuesAction(
      "nonexistent",
      "prefecture",
      "2024"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Ranking item not found");
    }
  });

  it("findRankingItem が success だが data が null の場合はエラーを返す", async () => {
    mockFindRankingItem.mockResolvedValue({
      success: true,
      data: null,
    });

    const result = await fetchRankingValuesAction(
      "population",
      "prefecture",
      "2024"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Ranking item not found");
    }
  });

  it("予期しない例外が発生した場合はエラーを返す", async () => {
    mockFindRankingItem.mockRejectedValue(new Error("DB connection failed"));

    const result = await fetchRankingValuesAction(
      "population",
      "prefecture",
      "2024"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("DB connection failed");
    }
  });

  it("非 Error オブジェクトの例外も処理する", async () => {
    mockFindRankingItem.mockRejectedValue("string error");

    const result = await fetchRankingValuesAction(
      "population",
      "prefecture",
      "2024"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("string error");
    }
  });
});
