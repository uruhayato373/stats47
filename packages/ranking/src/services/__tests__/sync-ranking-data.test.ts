import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@stats47/estat-api/server", () => ({
  fetchFormattedStats: vi.fn(),
  extractYearsFromStats: vi.fn().mockReturnValue([
    { yearCode: "2021", yearName: "2021年" },
    { yearCode: "2022", yearName: "2022年" },
  ]),
}));

vi.mock("@stats47/logger/server", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../repositories/ranking-item", () => ({
  findRankingItemByKey: vi.fn(),
  updateRankingItem: vi.fn(),
}));

vi.mock("../../repositories/ranking-value", () => ({
  listRankingValues: vi.fn(),
  upsertRankingValues: vi.fn(),
}));

import { fetchFormattedStats } from "@stats47/estat-api/server";
import type { RankingItem } from "@stats47/ranking";
import { findRankingItemByKey, updateRankingItem } from "../../repositories/ranking-item";
import { listRankingValues, upsertRankingValues } from "../../repositories/ranking-value";
import { fetchRankingData as fetchLatestRankingData } from "../fetch-ranking-data";
import { syncRankingExport } from "../sync-ranking-export";

const mockEstatData = [
  { yearCode: "2021", yearName: "2021年", areaCode: "01000", areaName: "北海道", value: 100, unit: "件", categoryCode: "cat1", categoryName: "catName1" },
  { yearCode: "2021", yearName: "2021年", areaCode: "13000", areaName: "東京都", value: 200, unit: "件", categoryCode: "cat1", categoryName: "catName1" },
  { yearCode: "2022", yearName: "2022年", areaCode: "01000", areaName: "北海道", value: 110, unit: "件", categoryCode: "cat1", categoryName: "catName1" },
  { yearCode: "2022", yearName: "2022年", areaCode: "13000", areaName: "東京都", value: 220, unit: "件", categoryCode: "cat1", categoryName: "catName1" },
];

const baseItem: RankingItem = {
  rankingKey: "test-ranking",
  areaType: "prefecture",
  rankingName: "テストランキング",
  title: "テストタイトル",
  unit: "件",
  dataSourceId: "estat",
  sourceConfig: {
    survey: { name: "test-survey" },
    statsDataId: "0000000001",
    cdCat01: "001",
  },
  availableYears: [
    { yearCode: "2021", yearName: "2021年" },
    { yearCode: "2022", yearName: "2022年" },
  ],
  isActive: true,
  isFeatured: false,
  featuredOrder: 0,
  valueDisplay: {},
  visualization: { colorScheme: "interpolateBlues", colorSchemeType: "sequential" },
  calculation: { isCalculated: false },
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
};

describe("fetchLatestRankingData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルト: fetchFormattedStats は有効なデータを返す
    vi.mocked(fetchFormattedStats).mockResolvedValue(mockEstatData as any);
    // デフォルト: findRankingItemByKey は成功
    vi.mocked(findRankingItemByKey).mockResolvedValue({
      success: true,
      data: { ...baseItem },
    } as any);
    // デフォルト: listRankingValues は年度でフィルタしたデータを返す
    vi.mocked(listRankingValues).mockImplementation(async (_key: string, _areaType: any, yearCode: string) => ({
      success: true,
      data: mockEstatData
        .filter((d) => d.yearCode === yearCode)
        .map((d, i) => ({ ...d, rank: i + 1 })),
    }));
  });

  it("should fetch latest ranking data successfully", async () => {
    const result = await fetchLatestRankingData(baseItem);

    expect(result.success).toBe(true);
    expect(result.message).toContain("2021");
    expect(result.years).toEqual([
      { yearCode: "2021", yearName: "2021年" },
      { yearCode: "2022", yearName: "2022年" },
    ]);
    expect(result.latestYearValues).toBeDefined();
    expect(result.latestYearValues?.length).toBeGreaterThan(0);
  });

  it("should return error when statsDataId is missing", async () => {
    const itemWithoutStatsDataId: RankingItem = {
      ...baseItem,
      rankingKey: "no-stats-id",
      sourceConfig: { survey: { name: "test-survey" } },
    };
    const result = await fetchLatestRankingData(itemWithoutStatsDataId);

    expect(result.success).toBe(false);
    expect(result.error).toContain("statsDataIdが未設定です");
    expect(fetchFormattedStats).not.toHaveBeenCalled();
  });

  it("should return error when API fetch fails", async () => {
    vi.mocked(fetchFormattedStats).mockRejectedValue(new Error("Network error"));

    const result = await fetchLatestRankingData(baseItem);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });

  describe("計算型ランキング", () => {
    const calculatedItem: RankingItem = {
      ...baseItem,
      rankingKey: "calc-ranking",
      calculation: {
        isCalculated: true,
        type: "ratio",
        numeratorKey: "num-key",
        denominatorKey: "den-key",
      },
    };

    it("should return error when calculation config is incomplete", async () => {
      const incompleteItem: RankingItem = {
        ...baseItem,
        rankingKey: "incomplete-calc",
        calculation: { isCalculated: true },
      };
      const result = await fetchLatestRankingData(incompleteItem);
      expect(result.success).toBe(false);
      expect(result.error).toContain("計算設定（分子または分母のキー）が不足しています");
    });

    it("should return error when dependency metadata is missing", async () => {
      // このテストでは findRankingItemByKey が失敗する
      vi.mocked(findRankingItemByKey).mockResolvedValue({
        success: false,
        error: new Error("not found"),
      } as any);

      const result = await fetchLatestRankingData(calculatedItem);

      expect(result.success).toBe(false);
      expect(result.error).toContain("分子または分母のランキングメタデータがD1に見つかりません");
    });

    it("should fetch calculated data correctly using listRankingValues", async () => {
      // 依存アイテム（num/den）は fetchEstatRankingData を呼ぶが、
      // 返ってきたデータが空の場合は listRankingValues にフォールバックする
      vi.mocked(fetchFormattedStats).mockResolvedValue([] as any);

      const result = await fetchLatestRankingData(calculatedItem);

      expect(result.success).toBe(true);
      expect(listRankingValues).toHaveBeenCalledWith("num-key", "prefecture", expect.any(String));
      expect(listRankingValues).toHaveBeenCalledWith("den-key", "prefecture", expect.any(String));
      expect(result.latestYearValues).toBeDefined();
    });
  });
});

describe("syncRankingExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchFormattedStats).mockResolvedValue(mockEstatData as any);
    vi.mocked(updateRankingItem).mockResolvedValue({ success: true } as any);
    vi.mocked(upsertRankingValues).mockResolvedValue({ success: true, data: 1 } as any);
  });

  it("エクスポート、DB更新、item.json保存が順次行われる", async () => {
    const result = await syncRankingExport(baseItem);

    expect(result.success).toBe(true);

    // 年度情報のDB更新
    expect(updateRankingItem).toHaveBeenCalledWith(
      "test-ranking",
      "prefecture",
      expect.objectContaining({
        latestYear: { yearCode: "2021", yearName: "2021年" },
      })
    );

    // ランキング値のDB格納
    expect(upsertRankingValues).toHaveBeenCalled();
  });

  it("skipDbSave: true の場合はDB書き込みが行われない", async () => {
    const result = await syncRankingExport(baseItem, { skipDbSave: true });

    expect(result.success).toBe(true);
    expect(updateRankingItem).not.toHaveBeenCalled();
    expect(upsertRankingValues).not.toHaveBeenCalled();
  });

  it("isAborted() が true の場合は早期リターンする", async () => {
    const result = await syncRankingExport(baseItem, {
      isAborted: () => true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("中断");
    expect(fetchFormattedStats).not.toHaveBeenCalled();
  });
});
