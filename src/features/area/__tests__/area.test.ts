/**
 * Area Domain Unit Tests
 * サービス層とユーティリティのテスト
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AreaRepository } from "../repositories/area-repository";
import { AreaService } from "../services/area-service";
import { MunicipalityService } from "../services/municipality-service";
import { PrefectureService } from "../services/prefecture-service";
import {
  getAreaLevel,
  getRegionKeyFromPrefectureCode,
  isMunicipalityCode,
  isPrefectureCode,
  isValidAreaCode,
  validateAreaCode,
} from "../utils/code-validator";

// ============================================================================
// Mock Data
// ============================================================================

const mockPrefectures = [
  { prefCode: "13", prefName: "東京都", regionKey: "kanto" },
  { prefCode: "27", prefName: "大阪府", regionKey: "kinki" },
  { prefCode: "01", prefName: "北海道", regionKey: "hokkaido" },
];

const mockMunicipalities = [
  {
    code: "13101",
    name: "千代田区",
    fullName: "東京都千代田区",
    prefCode: "13",
    parentCode: "13100",
    type: "ward" as const,
    level: 2,
  },
  {
    code: "13100",
    name: "東京特別区",
    fullName: "東京都東京特別区",
    prefCode: "13",
    type: "city" as const,
    level: 1,
  },
];

// ============================================================================
// Repository Tests
// ============================================================================

describe("AreaRepository", () => {
  beforeEach(() => {
    // キャッシュをクリア
    AreaRepository.clearCache();
  });

  it("should load prefectures from mock data", async () => {
    // Mock環境を設定
    process.env.NEXT_PUBLIC_USE_MOCK_DATA = "true";

    // Mock importを設定
    vi.doMock("@/data/mock/area/prefectures.json", () => ({
      default: {
        prefectures: mockPrefectures,
        regions: {
          kanto: ["13"],
          kinki: ["27"],
          hokkaido: ["01"],
        },
      },
    }));

    const prefectures = await AreaRepository.getPrefectures();

    expect(prefectures).toHaveLength(3);
    expect(prefectures[0]).toMatchObject({
      prefCode: "13",
      prefName: "東京都",
      regionKey: "kanto",
    });
  });

  it("should cache prefectures data", async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_DATA = "true";

    vi.doMock("@/data/mock/area/prefectures.json", () => ({
      default: {
        prefectures: mockPrefectures,
        regions: {},
      },
    }));

    // 初回取得
    const prefectures1 = await AreaRepository.getPrefectures();

    // 2回目取得（キャッシュから）
    const prefectures2 = await AreaRepository.getPrefectures();

    expect(prefectures1).toBe(prefectures2); // 同じオブジェクト参照
  });

  it("should clear cache", () => {
    AreaRepository.clearCache();
    const status = AreaRepository.getCacheStatus();

    expect(status.prefectures).toBe(false);
    expect(status.municipalities).toBe(0);
    expect(status.regions).toBe(false);
  });
});

// ============================================================================
// Prefecture Service Tests
// ============================================================================

describe("PrefectureService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get all prefectures", async () => {
    vi.spyOn(AreaRepository, "getPrefectures").mockResolvedValue(
      mockPrefectures
    );

    const result = await PrefectureService.getAllPrefectures();

    expect(result).toEqual(mockPrefectures);
    expect(AreaRepository.getPrefectures).toHaveBeenCalledTimes(1);
  });

  it("should get prefecture by code", async () => {
    vi.spyOn(AreaRepository, "getPrefectureByCode").mockResolvedValue(
      mockPrefectures[0]
    );

    const result = await PrefectureService.getPrefectureByCode("13");

    expect(result).toEqual(mockPrefectures[0]);
    expect(AreaRepository.getPrefectureByCode).toHaveBeenCalledWith("13");
  });

  it("should search prefectures by name", async () => {
    vi.spyOn(AreaRepository, "getPrefectures").mockResolvedValue(
      mockPrefectures
    );

    const result = await PrefectureService.search({ query: "東京" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].prefName).toBe("東京都");
    expect(result.total).toBe(1);
    expect(result.query).toBe("東京");
  });

  it("should search prefectures by region", async () => {
    vi.spyOn(AreaRepository, "getPrefectures").mockResolvedValue(
      mockPrefectures
    );

    const result = await PrefectureService.search({ regionKey: "kanto" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].regionKey).toBe("kanto");
  });

  it("should get prefectures by region", async () => {
    vi.spyOn(AreaRepository, "getPrefectures").mockResolvedValue(
      mockPrefectures
    );

    const result = await PrefectureService.getPrefecturesByRegion("kanto");

    expect(result).toHaveLength(1);
    expect(result[0].regionKey).toBe("kanto");
  });

  it("should check prefecture existence", async () => {
    vi.spyOn(AreaRepository, "getPrefectureByCode")
      .mockResolvedValueOnce(mockPrefectures[0])
      .mockRejectedValueOnce(new Error("Not found"));

    const exists1 = await PrefectureService.exists("13");
    const exists2 = await PrefectureService.exists("99");

    expect(exists1).toBe(true);
    expect(exists2).toBe(false);
  });
});

// ============================================================================
// Municipality Service Tests
// ============================================================================

describe("MunicipalityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get all municipalities", async () => {
    vi.spyOn(AreaRepository, "getMunicipalities").mockResolvedValue(
      mockMunicipalities
    );

    const result = await MunicipalityService.getAllMunicipalities();

    expect(result).toEqual(mockMunicipalities);
  });

  it("should get municipality by code", async () => {
    vi.spyOn(AreaRepository, "getMunicipalityByCode").mockResolvedValue(
      mockMunicipalities[0]
    );

    const result = await MunicipalityService.getMunicipalityByCode("13101");

    expect(result).toEqual(mockMunicipalities[0]);
  });

  it("should get municipalities by prefecture", async () => {
    vi.spyOn(AreaRepository, "getMunicipalitiesByPrefecture").mockResolvedValue(
      mockMunicipalities
    );

    const result = await MunicipalityService.getMunicipalitiesByPrefecture(
      "13"
    );

    expect(result).toEqual(mockMunicipalities);
  });

  it("should search municipalities by name", async () => {
    vi.spyOn(AreaRepository, "getMunicipalities").mockResolvedValue(
      mockMunicipalities
    );

    const result = await MunicipalityService.search({ query: "千代田" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("千代田区");
  });

  it("should search municipalities by type", async () => {
    vi.spyOn(AreaRepository, "getMunicipalities").mockResolvedValue(
      mockMunicipalities
    );

    const result = await MunicipalityService.search({ type: "ward" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("ward");
  });

  it("should get municipalities by type", async () => {
    vi.spyOn(AreaRepository, "getMunicipalities").mockResolvedValue(
      mockMunicipalities
    );

    const result = await MunicipalityService.getMunicipalitiesByType("ward");

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("ward");
  });

  it("should get wards by city", async () => {
    vi.spyOn(AreaRepository, "getMunicipalities").mockResolvedValue(
      mockMunicipalities
    );

    const result = await MunicipalityService.getWardsByCity("13100");

    expect(result).toHaveLength(1);
    expect(result[0].parentCode).toBe("13100");
  });
});

// ============================================================================
// Area Service Tests
// ============================================================================

describe("AreaService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get area hierarchy for prefecture", async () => {
    vi.spyOn(PrefectureService, "getPrefectureByCode").mockResolvedValue(
      mockPrefectures[0]
    );
    vi.spyOn(
      MunicipalityService,
      "getMunicipalitiesByPrefecture"
    ).mockResolvedValue(mockMunicipalities);

    const result = await AreaService.getAreaHierarchy("13000");

    expect(result.areaCode).toBe("13000");
    expect(result.areaName).toBe("東京都");
    expect(result.areaType).toBe("prefecture");
    expect(result.areaLevel).toBe("prefecture");
    expect(result.parentCode).toBe("00000");
    expect(result.children).toContain("13101");
  });

  it("should get area hierarchy for municipality", async () => {
    vi.spyOn(MunicipalityService, "getMunicipalityByCode").mockResolvedValue(
      mockMunicipalities[0]
    );
    vi.spyOn(AreaRepository, "getMunicipalities").mockResolvedValue(
      mockMunicipalities
    );

    const result = await AreaService.getAreaHierarchy("13101");

    expect(result.areaCode).toBe("13101");
    expect(result.areaName).toBe("千代田区");
    expect(result.areaType).toBe("municipality");
    expect(result.areaLevel).toBe("municipality");
    expect(result.parentCode).toBe("13000");
  });

  it("should get hierarchy path", async () => {
    vi.spyOn(AreaService, "getAreaHierarchy")
      .mockResolvedValueOnce({
        areaCode: "13101",
        areaName: "千代田区",
        areaType: "municipality",
        areaLevel: "municipality",
        parentCode: "13000",
        children: [],
      })
      .mockResolvedValueOnce({
        areaCode: "13000",
        areaName: "東京都",
        areaType: "prefecture",
        areaLevel: "prefecture",
        parentCode: "00000",
        children: ["13101"],
      });

    const result = await AreaService.getHierarchyPath("13101");

    expect(result).toHaveLength(3);
    expect(result[0].areaCode).toBe("00000");
    expect(result[1].areaCode).toBe("13000");
    expect(result[2].areaCode).toBe("13101");
  });

  it("should get children", async () => {
    vi.spyOn(AreaService, "getAreaHierarchy").mockResolvedValue({
      areaCode: "13000",
      areaName: "東京都",
      areaType: "prefecture",
      areaLevel: "prefecture",
      parentCode: "00000",
      children: ["13101"],
    });

    const result = await AreaService.getChildren("13000");

    expect(result).toHaveLength(1);
    expect(result[0].areaCode).toBe("13101");
  });

  it("should get parent", async () => {
    vi.spyOn(AreaService, "getAreaHierarchy")
      .mockResolvedValueOnce({
        areaCode: "13101",
        areaName: "千代田区",
        areaType: "municipality",
        areaLevel: "municipality",
        parentCode: "13000",
        children: [],
      })
      .mockResolvedValueOnce({
        areaCode: "13000",
        areaName: "東京都",
        areaType: "prefecture",
        areaLevel: "prefecture",
        parentCode: "00000",
        children: ["13101"],
      });

    const result = await AreaService.getParent("13101");

    expect(result).not.toBeNull();
    expect(result!.areaCode).toBe("13000");
  });
});

// ============================================================================
// Utility Tests
// ============================================================================

describe("Code Validator", () => {
  describe("isValidAreaCode", () => {
    it("should validate 5-digit codes", () => {
      expect(isValidAreaCode("13000")).toBe(true);
      expect(isValidAreaCode("13101")).toBe(true);
      expect(isValidAreaCode("00000")).toBe(true);
    });

    it("should reject invalid codes", () => {
      expect(isValidAreaCode("1234")).toBe(false);
      expect(isValidAreaCode("123456")).toBe(false);
      expect(isValidAreaCode("abcde")).toBe(false);
      expect(isValidAreaCode("")).toBe(false);
    });
  });

  describe("getAreaLevel", () => {
    it("should return correct levels", () => {
      expect(getAreaLevel("00000")).toBe("country");
      expect(getAreaLevel("13000")).toBe("prefecture");
      expect(getAreaLevel("13101")).toBe("municipality");
    });
  });

  describe("isPrefectureCode", () => {
    it("should identify prefecture codes", () => {
      expect(isPrefectureCode("13000")).toBe(true);
      expect(isPrefectureCode("27000")).toBe(true);
      expect(isPrefectureCode("00000")).toBe(false);
      expect(isPrefectureCode("13101")).toBe(false);
    });
  });

  describe("isMunicipalityCode", () => {
    it("should identify municipality codes", () => {
      expect(isMunicipalityCode("13101")).toBe(true);
      expect(isMunicipalityCode("27100")).toBe(true);
      expect(isMunicipalityCode("13000")).toBe(false);
      expect(isMunicipalityCode("00000")).toBe(false);
    });
  });

  describe("validateAreaCode", () => {
    it("should return valid result for valid codes", () => {
      const result = validateAreaCode("13000");

      expect(result.isValid).toBe(true);
      expect(result.value).toBe("13000");
      expect(result.error).toBeUndefined();
    });

    it("should return invalid result for invalid codes", () => {
      const result = validateAreaCode("1234");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid area code format");
    });
  });

  describe("getRegionKeyFromPrefectureCode", () => {
    it("should return correct region keys", () => {
      expect(getRegionKeyFromPrefectureCode("13")).toBe("kanto");
      expect(getRegionKeyFromPrefectureCode("27")).toBe("kinki");
      expect(getRegionKeyFromPrefectureCode("01")).toBe("hokkaido");
      expect(getRegionKeyFromPrefectureCode("99")).toBe("unknown");
    });
  });
});
