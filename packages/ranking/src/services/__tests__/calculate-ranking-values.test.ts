import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RankingItem, RankingValue } from "../../types";
import { calculateRankingValues } from "../calculate-ranking-values";

vi.mock("../../repositories/ranking-item", () => ({
  findRankingItemByKey: vi.fn(),
}));

vi.mock("../../repositories/ranking-value", () => ({
  listRankingValues: vi.fn(),
}));

import { findRankingItemByKey } from "../../repositories/ranking-item";
import { listRankingValues } from "../../repositories/ranking-value";

describe("calculateRankingValues", () => {
  const baseItem: RankingItem = {
    rankingKey: "test-calculated",
    areaType: "prefecture",
    rankingName: "Calculated Ranking",
    title: "Calculated Title",
    unit: "%",
    dataSourceId: "test",
    isActive: true,
    isFeatured: false,
    featuredOrder: 0,
    calculation: {
        isCalculated: true,
        type: "ratio",
        numeratorKey: "num-key",
        denominatorKey: "den-key",
    },
    createdAt: "",
    updatedAt: "",
  };

  const mockValues = (key: string, val: number): RankingValue => ({
    areaType: "prefecture",
    areaCode: "01000",
    areaName: "Hokkaido",
    yearCode: "2020",
    yearName: "2020年度",
    rank: 1,
    categoryCode: key,
    categoryName: "Category",
    value: val,
    unit: "unit",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findRankingItemByKey).mockResolvedValue({ success: true, data: { rankingKey: "found" } } as any);
  });

  describe("ratio calculation", () => {
    it("should return empty if numeratorKey or denominatorKey are missing", async () => {
       const item = { ...baseItem, calculation: { ...baseItem.calculation, numeratorKey: undefined } } as RankingItem;
       const result = await calculateRankingValues(item, "2020");
       expect(result).toEqual([]);
    });

    it("should calculate ratio correctly when data exists in DB", async () => {
        vi.mocked(listRankingValues).mockImplementation(async (key: string) => {
            if (key === "num-key") return { success: true, data: [mockValues("num-key", 50)] };
            if (key === "den-key") return { success: true, data: [mockValues("den-key", 100)] };
            return { success: true, data: [] };
        });

        const result = await calculateRankingValues(baseItem, "2020");
        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(0.5); // 50 / 100
        expect(result[0].categoryCode).toBe("test-calculated");
    });
  });

  describe("per_capita calculation", () => {
      const perCapitaItem: RankingItem = {
          ...baseItem,
          calculation: {
              isCalculated: true,
              type: "per_capita",
              numeratorKey: "num-key",
          }
      };

      it("should calculate per_capita correctly", async () => {
        vi.mocked(listRankingValues).mockImplementation(async (key: string) => {
            if (key === "num-key") return { success: true, data: [mockValues("num-key", 200)] };
            if (key === "total-population") return { success: true, data: [mockValues("total-population", 1000)] };
            return { success: true, data: [] };
        });

        const result = await calculateRankingValues(perCapitaItem, "2020");
        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(0.2); // 200 / 1000
      });

      it("should return empty when DB has no data", async () => {
          // DB empty for all keys
          vi.mocked(listRankingValues).mockResolvedValue({ success: true, data: [] });

          const result = await calculateRankingValues(perCapitaItem, "2020");

          expect(result).toEqual([]);
      });
  });

  describe("循環参照ガード", () => {
      it("同じキーで再帰呼び出しされた場合は空配列を返すこと", async () => {
          // visitedにすでに同じキーが含まれている状態で呼び出す
          const visited = new Set(["test-calculated:2020"]);
          const result = await calculateRankingValues(baseItem, "2020", visited);
          expect(result).toEqual([]);
          // DBやfetchは一切呼ばれない
          expect(listRankingValues).not.toHaveBeenCalled();
      });

      it("visitedなしの初回呼び出しは正常に処理されること", async () => {
          vi.mocked(listRankingValues).mockImplementation(async (key: string) => {
              if (key === "num-key") return { success: true, data: [mockValues("num-key", 50)] };
              if (key === "den-key") return { success: true, data: [mockValues("den-key", 100)] };
              return { success: true, data: [] };
          });

          const result = await calculateRankingValues(baseItem, "2020");
          expect(result).toHaveLength(1);
          expect(result[0].value).toBe(0.5);
      });

      it("計算中にエラーが発生した場合は空配列を返すこと", async () => {
          vi.mocked(listRankingValues).mockRejectedValue(new Error("DB error"));
          const result = await calculateRankingValues(baseItem, "2020");
          expect(result).toEqual([]);
      });
  });
});
