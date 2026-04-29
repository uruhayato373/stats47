import {
  readRankingItemFromR2,
  readRankingValuesFromR2,
  computeNormalization,
} from "@stats47/ranking/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@stats47/ranking/server");

import { fetchRankingValuesAction } from "../fetch-ranking-values";

import type { RankingItem, RankingValue } from "@stats47/ranking";

const mockReadRankingItem = vi.mocked(readRankingItemFromR2);
const mockReadRankingValues = vi.mocked(readRankingValuesFromR2);
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
    mockReadRankingItem.mockResolvedValue({
      success: true,
      data: mockRankingItem,
    });
    mockReadRankingValues.mockResolvedValue({
      success: true,
      data: mockValues,
    });

    const result = await fetchRankingValuesAction(
      "population",
      "prefecture",
      "2024"
    );

    expect(result.success).toBe(true);
    expect(mockReadRankingItem).toHaveBeenCalledWith("population", "prefecture");
    expect(mockReadRankingValues).toHaveBeenCalledWith(
      "population",
      "prefecture",
      "2024"
    );
    expect(mockComputeNormalization).not.toHaveBeenCalled();
  });

  it("正規化タイプ指定時は computeNormalization を呼ぶ", async () => {
    mockReadRankingItem.mockResolvedValue({
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
    expect(mockReadRankingValues).not.toHaveBeenCalled();
  });

  it("ランキング項目が見つからない場合はエラーを返す", async () => {
    mockReadRankingItem.mockResolvedValue({
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

  it("readRankingItemFromR2 が success だが data が null の場合はエラーを返す", async () => {
    mockReadRankingItem.mockResolvedValue({
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
    mockReadRankingItem.mockRejectedValue(new Error("DB connection failed"));

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
    mockReadRankingItem.mockRejectedValue("string error");

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
