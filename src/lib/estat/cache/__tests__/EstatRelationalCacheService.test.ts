/**
 * EstatRelationalCacheService 単体テスト（モック版）
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { EstatRelationalCacheService } from "@/lib/estat/cache/EstatRelationalCacheService";
import { FormattedValue } from "@/lib/estat/types/formatted";

// モックデータ
const mockFormattedValues: FormattedValue[] = [
  {
    value: "1000000",
    numericValue: 1000000,
    displayValue: "1,000,000人",
    unit: "人",
    areaCode: "13000",
    areaName: "東京都",
    categoryCode: "0000000",
    categoryName: "総人口",
    timeCode: "2024100000",
    timeName: "2024年10月",
    rank: 1,
  },
  {
    value: "800000",
    numericValue: 800000,
    displayValue: "800,000人",
    unit: "人",
    areaCode: "27000",
    areaName: "大阪府",
    categoryCode: "0000000",
    categoryName: "総人口",
    timeCode: "2024100000",
    timeName: "2024年10月",
    rank: 2,
  },
];

// d1-clientをモック
vi.mock("@/lib/d1-client", () => ({
  createD1Database: vi.fn().mockResolvedValue({
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
        all: vi.fn().mockResolvedValue({
          success: true,
          results: [
            {
              value: "1000000",
              numeric_value: 1000000,
              display_value: "1,000,000人",
              rank: 1,
              area_code: "13000",
              area_name: "東京都",
              category_code: "0000000",
              category_name: "総人口",
              time_code: "2024100000",
              time_name: "2024年10月",
              unit: "人",
            },
            {
              value: "800000",
              numeric_value: 800000,
              display_value: "800,000人",
              rank: 2,
              area_code: "27000",
              area_name: "大阪府",
              category_code: "0000000",
              category_name: "総人口",
              time_code: "2024100000",
              time_name: "2024年10月",
              unit: "人",
            },
          ],
        }),
        first: vi.fn().mockResolvedValue({ id: 1 }),
      }),
    }),
  }),
}));

describe("EstatRelationalCacheService", () => {
  const testStatsDataId = "test_stats_data_id";
  const testCategoryCode = "0000000";
  const testTimeCode = "2024100000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveRankingData", () => {
    it("データを正常に保存できる", async () => {
      await expect(
        EstatRelationalCacheService.saveRankingData(
          testStatsDataId,
          testCategoryCode,
          testTimeCode,
          mockFormattedValues
        )
      ).resolves.not.toThrow();
    });

    it("空のデータ配列を処理できる", async () => {
      await expect(
        EstatRelationalCacheService.saveRankingData(
          testStatsDataId,
          testCategoryCode,
          testTimeCode,
          []
        )
      ).resolves.not.toThrow();
    });
  });

  describe("getRankingData", () => {
    it("保存したデータを正常に取得できる", async () => {
      const result = await EstatRelationalCacheService.getRankingData(
        testStatsDataId,
        testCategoryCode,
        testTimeCode
      );

      expect(result).not.toBeNull();
      expect(result).toHaveLength(2);
      expect(result![0]).toMatchObject({
        areaCode: "13000",
        areaName: "東京都",
        numericValue: 1000000,
        rank: 1,
      });
      expect(result![1]).toMatchObject({
        areaCode: "27000",
        areaName: "大阪府",
        numericValue: 800000,
        rank: 2,
      });
    });

    it("存在しないデータはnullを返す", async () => {
      const result = await EstatRelationalCacheService.getRankingData(
        "non_existent_id",
        testCategoryCode,
        testTimeCode
      );

      expect(result).toBeNull();
    });
  });

  describe("getAvailableYears", () => {
    it("利用可能な年度一覧を取得できる", async () => {
      const years = await EstatRelationalCacheService.getAvailableYears(
        testStatsDataId,
        testCategoryCode
      );

      expect(years).not.toBeNull();
      expect(years).toHaveLength(2);
      expect(years).toContain("2023100000");
      expect(years).toContain("2024100000");
    });

    it("存在しないカテゴリはnullを返す", async () => {
      const years = await EstatRelationalCacheService.getAvailableYears(
        testStatsDataId,
        "non_existent_category"
      );

      expect(years).toBeNull();
    });
  });

  describe("getCacheStats", () => {
    it("キャッシュ統計情報を取得できる", async () => {
      const stats = await EstatRelationalCacheService.getCacheStats();

      expect(stats).toMatchObject({
        totalRecords: expect.any(Number),
        totalCategories: expect.any(Number),
        totalTimePeriods: expect.any(Number),
        cacheHitRate: expect.any(Number),
      });
    });
  });

  describe("cleanupExpiredCache", () => {
    it("期限切れキャッシュの削除を実行できる", async () => {
      const deletedCount =
        await EstatRelationalCacheService.cleanupExpiredCache();

      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });
});
