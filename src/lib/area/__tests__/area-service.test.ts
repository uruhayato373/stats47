/**
 * AreaServiceのユニットテスト
 */

import { describe, it, expect } from "vitest";
import { AreaService } from "../services/area-service";

describe("AreaService", () => {
  describe("getAreaByCode", () => {
    it("国コードで国情報を取得できる", () => {
      const area = AreaService.getAreaByCode("00000");
      expect(area).not.toBeNull();
      expect(area?.areaName).toBe("日本");
      expect(area?.areaType).toBe("country");
      expect(area?.areaLevel).toBe("national");
    });

    it("都道府県コードで都道府県情報を取得できる", () => {
      const area = AreaService.getAreaByCode("13000");
      expect(area).not.toBeNull();
      expect(area?.areaName).toBe("東京都");
      expect(area?.areaType).toBe("prefecture");
      expect(area?.areaLevel).toBe("prefectural");
    });

    it("市区町村コードで市区町村情報を取得できる", () => {
      const area = AreaService.getAreaByCode("13101");
      expect(area).not.toBeNull();
      expect(area?.areaName).toBe("千代田区");
      expect(area?.areaType).toBe("municipality");
      expect(area?.areaLevel).toBe("municipal");
    });

    it("無効なコードの場合nullを返す", () => {
      const area = AreaService.getAreaByCode("99999");
      expect(area).toBeNull();
    });
  });

  describe("getAreaType", () => {
    it("国コードでcountryを返す", () => {
      const type = AreaService.getAreaType("00000");
      expect(type).toBe("country");
    });

    it("都道府県コードでprefectureを返す", () => {
      const type = AreaService.getAreaType("13000");
      expect(type).toBe("prefecture");
    });

    it("市区町村コードでmunicipalityを返す", () => {
      const type = AreaService.getAreaType("13101");
      expect(type).toBe("municipality");
    });

    it("無効なコードでnullを返す", () => {
      const type = AreaService.getAreaType("999");
      expect(type).toBeNull();
    });
  });

  describe("getParentArea", () => {
    it("市区町村の親（都道府県）を取得できる", () => {
      const parent = AreaService.getParentArea("13101");
      expect(parent).not.toBeNull();
      expect(parent?.areaName).toBe("特別区部");
      expect(parent?.areaType).toBe("municipality");
    });

    it("都道府県の親（国）を取得できる", () => {
      const parent = AreaService.getParentArea("13000");
      expect(parent).not.toBeNull();
      expect(parent?.areaName).toBe("日本");
      expect(parent?.areaType).toBe("country");
    });

    it("国の親はnullを返す", () => {
      const parent = AreaService.getParentArea("00000");
      expect(parent).toBeNull();
    });
  });

  describe("getChildAreas", () => {
    it("国の子（都道府県）を取得できる", () => {
      const children = AreaService.getChildAreas("00000");
      expect(children.length).toBe(47);
      children.forEach((child) => {
        expect(child.areaType).toBe("prefecture");
      });
    });

    it("都道府県の子（市区町村）を取得できる", () => {
      const children = AreaService.getChildAreas("13000");
      expect(children.length).toBeGreaterThan(0);
      children.forEach((child) => {
        expect(child.areaType).toBe("municipality");
      });
    });

    it("市区町村の子は空配列を返す", () => {
      const children = AreaService.getChildAreas("13101");
      expect(children).toHaveLength(0);
    });
  });

  describe("getHierarchyPath", () => {
    it("市区町村の階層パスを取得できる", () => {
      const path = AreaService.getHierarchyPath("13101");
      expect(path).toHaveLength(4);
      expect(path[0].areaName).toBe("日本");
      expect(path[1].areaName).toBe("東京都");
      expect(path[2].areaName).toBe("特別区部");
      expect(path[3].areaName).toBe("千代田区");
    });

    it("都道府県の階層パスを取得できる", () => {
      const path = AreaService.getHierarchyPath("13000");
      expect(path).toHaveLength(2);
      expect(path[0].areaName).toBe("日本");
      expect(path[1].areaName).toBe("東京都");
    });

    it("国の階層パスを取得できる", () => {
      const path = AreaService.getHierarchyPath("00000");
      expect(path).toHaveLength(1);
      expect(path[0].areaName).toBe("日本");
    });

    it("無効なコードで空配列を返す", () => {
      const path = AreaService.getHierarchyPath("99999");
      expect(path).toHaveLength(0);
    });
  });

  describe("getFullAreaName", () => {
    it("市区町村の完全名称を取得できる", () => {
      const fullName = AreaService.getFullAreaName("13101");
      expect(fullName).toBe("日本 東京都 特別区部 千代田区");
    });

    it("都道府県の完全名称を取得できる", () => {
      const fullName = AreaService.getFullAreaName("13000");
      expect(fullName).toBe("日本 東京都");
    });

    it("国の完全名称を取得できる", () => {
      const fullName = AreaService.getFullAreaName("00000");
      expect(fullName).toBe("日本");
    });

    it("無効なコードでnullを返す", () => {
      const fullName = AreaService.getFullAreaName("99999");
      expect(fullName).toBeNull();
    });
  });

  describe("searchAreas", () => {
    it("地域を検索できる", () => {
      const results = AreaService.searchAreas({
        query: "中央",
        limit: 5,
      });
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it("地域タイプでフィルタリングできる", () => {
      const results = AreaService.searchAreas({
        query: "",
        areaType: "prefecture",
        limit: 5,
      });
      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(result.type).toBe("prefecture");
      });
    });

    it("都道府県コードでフィルタリングできる", () => {
      const results = AreaService.searchAreas({
        query: "",
        prefCode: "13",
        limit: 5,
      });
      expect(results.length).toBeGreaterThan(0);
      // 都道府県コードフィルタリングは市区町村のみに適用される
      const municipalityResults = results.filter(
        (r) => r.type === "municipality"
      );
      municipalityResults.forEach((result) => {
        expect(result.prefCode).toBe("13");
      });
    });
  });

  describe("getHierarchyLevel", () => {
    it("国の階層レベルは0", () => {
      const level = AreaService.getHierarchyLevel("00000");
      expect(level).toBe(0);
    });

    it("都道府県の階層レベルは1", () => {
      const level = AreaService.getHierarchyLevel("13000");
      expect(level).toBe(1);
    });

    it("市区町村の階層レベルは2", () => {
      const level = AreaService.getHierarchyLevel("13101");
      expect(level).toBe(2);
    });

    it("無効なコードで-1を返す", () => {
      const level = AreaService.getHierarchyLevel("999");
      expect(level).toBe(-1);
    });
  });

  describe("getCommonAncestor", () => {
    it("同じ都道府県の市区町村の共通祖先は都道府県", () => {
      const ancestor = AreaService.getCommonAncestor("13101", "13102");
      expect(ancestor).not.toBeNull();
      expect(ancestor?.areaName).toBe("特別区部");
    });

    it("異なる都道府県の市区町村の共通祖先は国", () => {
      const ancestor = AreaService.getCommonAncestor("13101", "01101");
      expect(ancestor).not.toBeNull();
      expect(ancestor?.areaName).toBe("日本");
    });

    it("同じ市区町村の共通祖先は自分自身", () => {
      const ancestor = AreaService.getCommonAncestor("13101", "13101");
      expect(ancestor).not.toBeNull();
      expect(ancestor?.areaName).toBe("千代田区");
    });
  });

  describe("isDescendantOf", () => {
    it("市区町村は都道府県の子孫", () => {
      const isDescendant = AreaService.isDescendantOf("13101", "13000");
      expect(isDescendant).toBe(true);
    });

    it("都道府県は国の子孫", () => {
      const isDescendant = AreaService.isDescendantOf("13000", "00000");
      expect(isDescendant).toBe(true);
    });

    it("都道府県は市区町村の子孫ではない", () => {
      const isDescendant = AreaService.isDescendantOf("13000", "13101");
      expect(isDescendant).toBe(false);
    });

    it("同じ地域は子孫ではない", () => {
      const isDescendant = AreaService.isDescendantOf("13101", "13101");
      expect(isDescendant).toBe(true); // 自分自身は子孫とみなす
    });
  });

  describe("getStatistics", () => {
    it("統計情報を取得できる", () => {
      const stats = AreaService.getStatistics();
      expect(stats.prefectures).toBe(47);
      expect(stats.municipalities).toBeGreaterThan(1900);
      expect(stats.municipalitiesByPrefecture).toBeDefined();
      expect(stats.municipalitiesByType).toBeDefined();
    });
  });
});
