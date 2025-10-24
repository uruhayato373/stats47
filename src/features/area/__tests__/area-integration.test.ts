/**
 * Area Domain Integration Tests
 * エンドツーエンドのデータフローとキャッシュ動作のテスト
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AreaRepository } from "../repositories/area-repository";
import { AreaService } from "../services/area-service";
import { MunicipalityService } from "../services/municipality-service";
import { PrefectureService } from "../services/prefecture-service";

// ============================================================================
// Mock Data
// ============================================================================

const mockPrefecturesData = {
  prefectures: [
    { prefCode: "13", prefName: "東京都" },
    { prefCode: "27", prefName: "大阪府" },
    { prefCode: "01", prefName: "北海道" },
  ],
  regions: {
    kanto: ["13"],
    kinki: ["27"],
    hokkaido: ["01"],
  },
};

const mockMunicipalitiesData = {
  municipalities: [
    {
      "@code": "13101",
      "@name": "千代田区",
      "@level": "2",
      "@parentCode": "13",
    },
    {
      "@code": "13100",
      "@name": "東京特別区",
      "@level": "1",
      "@parentCode": "13",
    },
    {
      "@code": "27100",
      "@name": "大阪市",
      "@level": "1",
      "@parentCode": "27",
    },
  ],
};

// ============================================================================
// Integration Tests
// ============================================================================

describe("Area Domain Integration", () => {
  beforeEach(() => {
    // 環境変数を設定
    process.env.NEXT_PUBLIC_USE_MOCK_DATA = "true";

    // キャッシュをクリア
    AreaRepository.clearCache();

    // Mock importを設定
    vi.doMock("@/data/mock/area/prefectures.json", () => ({
      default: mockPrefecturesData,
    }));

    vi.doMock("@/data/mock/area/municipalities.json", () => ({
      default: mockMunicipalitiesData,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    AreaRepository.clearCache();
  });

  describe("Data Flow Integration", () => {
    it("should complete full data flow from repository to service", async () => {
      // 1. Repository層でデータ取得
      const prefectures = await AreaRepository.getPrefectures();
      expect(prefectures).toHaveLength(3);
      expect(prefectures[0].regionKey).toBe("kanto");

      // 2. Service層でビジネスロジック実行
      const searchResult = await PrefectureService.search({ query: "東京" });
      expect(searchResult.items).toHaveLength(1);
      expect(searchResult.items[0].prefName).toBe("東京都");

      // 3. 階層構造の構築
      const hierarchy = await AreaService.getAreaHierarchy("13000");
      expect(hierarchy.areaName).toBe("東京都");
      expect(hierarchy.areaLevel).toBe("prefecture");
    });

    it("should handle municipality data flow", async () => {
      // 1. 市区町村データ取得
      const municipalities = await AreaRepository.getMunicipalities();
      expect(municipalities).toHaveLength(3);

      // 2. 都道府県別市区町村取得
      const tokyoMunicipalities =
        await MunicipalityService.getMunicipalitiesByPrefecture("13");
      expect(tokyoMunicipalities).toHaveLength(2);

      // 3. 市区町村検索
      const searchResult = await MunicipalityService.search({
        query: "千代田",
      });
      expect(searchResult.items).toHaveLength(1);
      expect(searchResult.items[0].name).toBe("千代田区");
    });

    it("should build complete hierarchy structure", async () => {
      // 1. 都道府県階層
      const prefectureHierarchy = await AreaService.getAreaHierarchy("13000");
      expect(prefectureHierarchy.areaName).toBe("東京都");
      expect(prefectureHierarchy.children).toContain("13101");

      // 2. 市区町村階層
      const municipalityHierarchy = await AreaService.getAreaHierarchy("13101");
      expect(municipalityHierarchy.areaName).toBe("千代田区");
      expect(municipalityHierarchy.parentCode).toBe("13000");

      // 3. 階層パス
      const hierarchyPath = await AreaService.getHierarchyPath("13101");
      expect(hierarchyPath).toHaveLength(3);
      expect(hierarchyPath[0].areaCode).toBe("00000"); // 国
      expect(hierarchyPath[1].areaCode).toBe("13000"); // 東京都
      expect(hierarchyPath[2].areaCode).toBe("13101"); // 千代田区
    });
  });

  describe("Cache Integration", () => {
    it("should cache data across service calls", async () => {
      // 初回取得
      const prefectures1 = await PrefectureService.getAllPrefectures();
      expect(prefectures1).toHaveLength(3);

      // 2回目取得（キャッシュから）
      const prefectures2 = await PrefectureService.getAllPrefectures();
      expect(prefectures2).toBe(prefectures1); // 同じオブジェクト参照

      // キャッシュ状態確認
      const cacheStatus = AreaRepository.getCacheStatus();
      expect(cacheStatus.prefectures).toBe(true);
    });

    it("should cache municipalities by prefecture", async () => {
      // 初回取得
      const municipalities1 =
        await MunicipalityService.getMunicipalitiesByPrefecture("13");
      expect(municipalities1).toHaveLength(2);

      // 2回目取得（キャッシュから）
      const municipalities2 =
        await MunicipalityService.getMunicipalitiesByPrefecture("13");
      expect(municipalities2).toBe(municipalities1); // 同じオブジェクト参照

      // キャッシュ状態確認
      const cacheStatus = AreaRepository.getCacheStatus();
      expect(cacheStatus.municipalities).toBe(1); // 1つの都道府県がキャッシュされている
    });

    it("should clear cache properly", async () => {
      // データを取得してキャッシュに保存
      await PrefectureService.getAllPrefectures();
      await MunicipalityService.getMunicipalitiesByPrefecture("13");

      // キャッシュ状態確認
      let cacheStatus = AreaRepository.getCacheStatus();
      expect(cacheStatus.prefectures).toBe(true);
      expect(cacheStatus.municipalities).toBe(1);

      // キャッシュクリア
      AreaRepository.clearCache();

      // キャッシュ状態確認
      cacheStatus = AreaRepository.getCacheStatus();
      expect(cacheStatus.prefectures).toBe(false);
      expect(cacheStatus.municipalities).toBe(0);
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle missing prefecture gracefully", async () => {
      // 存在しない都道府県コード
      await expect(
        PrefectureService.getPrefectureByCode("99")
      ).rejects.toThrow();

      // 存在チェック
      const exists = await PrefectureService.exists("99");
      expect(exists).toBe(false);
    });

    it("should handle missing municipality gracefully", async () => {
      // 存在しない市区町村コード
      await expect(
        MunicipalityService.getMunicipalityByCode("99999")
      ).rejects.toThrow();

      // 存在チェック
      const exists = await MunicipalityService.exists("99999");
      expect(exists).toBe(false);
    });

    it("should handle invalid area hierarchy", async () => {
      // 無効な地域コード
      await expect(AreaService.getAreaHierarchy("99999")).rejects.toThrow();
    });
  });

  describe("Search Integration", () => {
    it("should perform complex search operations", async () => {
      // 都道府県検索
      const prefectureSearch = await PrefectureService.search({
        query: "東京",
        regionKey: "kanto",
      });
      expect(prefectureSearch.items).toHaveLength(1);
      expect(prefectureSearch.items[0].prefName).toBe("東京都");

      // 市区町村検索
      const municipalitySearch = await MunicipalityService.search({
        query: "区",
        prefCode: "13",
        type: "ward",
      });
      expect(municipalitySearch.items).toHaveLength(1);
      expect(municipalitySearch.items[0].name).toBe("千代田区");

      // 地域検索
      const areaSearch = await AreaService.search({
        query: "東京",
        level: "prefecture",
      });
      expect(areaSearch.items).toHaveLength(1);
      expect(areaSearch.items[0].areaName).toBe("東京都");
    });

    it("should handle empty search results", async () => {
      // 存在しないクエリで検索
      const result = await PrefectureService.search({
        query: "存在しない都道府県",
      });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.query).toBe("存在しない都道府県");
    });
  });

  describe("Statistics Integration", () => {
    it("should calculate comprehensive statistics", async () => {
      // 都道府県統計
      const prefectureStats = await PrefectureService.getStatistics();
      expect(prefectureStats.total).toBe(3);
      expect(prefectureStats.byRegion.kanto).toBe(1);
      expect(prefectureStats.byRegion.kinki).toBe(1);
      expect(prefectureStats.byRegion.hokkaido).toBe(1);

      // 市区町村統計
      const municipalityStats = await MunicipalityService.getStatistics();
      expect(municipalityStats.total).toBe(3);
      expect(municipalityStats.byType.city).toBe(2);
      expect(municipalityStats.byType.ward).toBe(1);

      // 地域統計
      const areaStats = await AreaService.getStatistics();
      expect(areaStats.totalPrefectures).toBe(3);
      expect(areaStats.totalMunicipalities).toBe(3);
      expect(areaStats.byLevel.prefecture).toBe(3);
      expect(areaStats.byLevel.municipality).toBe(3);
    });

    it("should calculate prefecture-specific statistics", async () => {
      const stats = await MunicipalityService.getPrefectureStatistics("13");
      expect(stats.total).toBe(2);
      expect(stats.byType.city).toBe(1);
      expect(stats.byType.ward).toBe(1);
    });
  });

  describe("Performance Integration", () => {
    it("should handle multiple concurrent requests efficiently", async () => {
      const startTime = Date.now();

      // 複数の並行リクエスト
      const promises = [
        PrefectureService.getAllPrefectures(),
        MunicipalityService.getAllMunicipalities(),
        PrefectureService.search({ regionKey: "kanto" }),
        MunicipalityService.search({ prefCode: "13" }),
      ];

      const results = await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 結果の検証
      expect(results[0]).toHaveLength(3); // 都道府県
      expect(results[1]).toHaveLength(3); // 市区町村
      expect(results[2].items).toHaveLength(1); // 関東の都道府県
      expect(results[3].items).toHaveLength(2); // 東京都の市区町村

      // パフォーマンス検証（1秒以内に完了）
      expect(duration).toBeLessThan(1000);
    });

    it("should maintain cache efficiency across multiple operations", async () => {
      // 複数の操作を実行
      await PrefectureService.getAllPrefectures();
      await MunicipalityService.getMunicipalitiesByPrefecture("13");
      await MunicipalityService.getMunicipalitiesByPrefecture("27");
      await PrefectureService.search({ query: "東京" });
      await MunicipalityService.search({ type: "ward" });

      // キャッシュ状態確認
      const cacheStatus = AreaRepository.getCacheStatus();
      expect(cacheStatus.prefectures).toBe(true);
      expect(cacheStatus.municipalities).toBe(2); // 2つの都道府県がキャッシュされている
      expect(cacheStatus.regions).toBe(true);
    });
  });
});
