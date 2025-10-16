/**
 * MunicipalityServiceのユニットテスト
 */

import { describe, it, expect } from "vitest";
import { MunicipalityService } from "../services/municipality-service";

describe("MunicipalityService", () => {
  describe("getAllMunicipalities", () => {
    it("全市区町村を取得できる", () => {
      const municipalities = MunicipalityService.getAllMunicipalities();
      expect(municipalities.length).toBeGreaterThan(1900);
    });

    it("取得した市区町村にcodeとnameが含まれる", () => {
      const municipalities = MunicipalityService.getAllMunicipalities();
      const firstMunic = municipalities[0];

      expect(firstMunic).toHaveProperty("code");
      expect(firstMunic).toHaveProperty("name");
      expect(firstMunic).toHaveProperty("prefCode");
      expect(firstMunic).toHaveProperty("type");
    });
  });

  describe("getMunicipalityByCode", () => {
    it("5桁コードから市区町村を取得できる", () => {
      const munic = MunicipalityService.getMunicipalityByCode("13101");
      expect(munic).not.toBeNull();
      expect(munic?.name).toBe("千代田区");
    });

    it("札幌市を取得できる", () => {
      const munic = MunicipalityService.getMunicipalityByCode("01100");
      expect(munic?.name).toBe("札幌市");
      expect(munic?.type).toBe("city");
    });

    it("無効なコードの場合nullを返す", () => {
      const munic = MunicipalityService.getMunicipalityByCode("99999");
      expect(munic).toBeNull();
    });

    it("存在しないコードの場合nullを返す", () => {
      const munic = MunicipalityService.getMunicipalityByCode("99999");
      expect(munic).toBeNull();
    });
  });

  describe("getMunicipalityByName", () => {
    it("市区町村名から市区町村を取得できる", () => {
      const munic = MunicipalityService.getMunicipalityByName("千代田区");
      expect(munic).not.toBeNull();
      expect(munic?.code).toBe("13101");
    });

    it("都道府県を指定して市区町村を取得できる", () => {
      const munic = MunicipalityService.getMunicipalityByName("千代田区", "13");
      expect(munic).not.toBeNull();
      expect(munic?.code).toBe("13101");
    });

    it("存在しない名前の場合nullを返す", () => {
      const munic = MunicipalityService.getMunicipalityByName("存在しない区");
      expect(munic).toBeNull();
    });
  });

  describe("getMunicipalitiesByPrefecture", () => {
    it("都道府県内の全市区町村を取得できる", () => {
      const munics = MunicipalityService.getMunicipalitiesByPrefecture("13");
      expect(munics.length).toBeGreaterThan(0);
    });

    it("取得した市区町村が指定都道府県に属する", () => {
      const munics = MunicipalityService.getMunicipalitiesByPrefecture("13");
      munics.forEach((munic) => {
        expect(munic.prefCode).toBe("13");
      });
    });

    it("存在しない都道府県の場合空配列を返す", () => {
      const munics = MunicipalityService.getMunicipalitiesByPrefecture("99");
      expect(munics).toHaveLength(0);
    });
  });

  describe("getMunicipalitiesByType", () => {
    it("市区町村タイプで絞り込みできる", () => {
      const cities = MunicipalityService.getMunicipalitiesByType("city");
      expect(cities.length).toBeGreaterThan(0);
      cities.forEach((city) => {
        expect(city.type).toBe("city");
      });
    });

    it("区で絞り込みできる", () => {
      const wards = MunicipalityService.getMunicipalitiesByType("ward");
      expect(wards.length).toBeGreaterThan(0);
      wards.forEach((ward) => {
        expect(ward.type).toBe("ward");
      });
    });
  });

  describe("getMunicipalitiesByPrefectureAndType", () => {
    it("都道府県×タイプで絞り込みできる", () => {
      const tokyoWards =
        MunicipalityService.getMunicipalitiesByPrefectureAndType("13", "ward");
      expect(tokyoWards.length).toBeGreaterThan(0);
      tokyoWards.forEach((ward) => {
        expect(ward.prefCode).toBe("13");
        expect(ward.type).toBe("ward");
      });
    });
  });

  describe("searchMunicipalities", () => {
    it("名前で部分一致検索できる", () => {
      const results = MunicipalityService.searchMunicipalities({
        query: "中央",
      });
      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(result.name).toContain("中央");
      });
    });

    it("都道府県でフィルタリングできる", () => {
      const results = MunicipalityService.searchMunicipalities({
        query: "",
        prefCode: "13",
      });
      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(result.prefCode).toBe("13");
      });
    });

    it("タイプでフィルタリングできる", () => {
      const results = MunicipalityService.searchMunicipalities({
        query: "",
        type: "ward",
      });
      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(result.type).toBe("ward");
      });
    });

    it("制限数で結果を制限できる", () => {
      const results = MunicipalityService.searchMunicipalities({
        query: "中央",
        limit: 5,
      });
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe("existsMunicipality", () => {
    it("存在する市区町村の場合trueを返す", () => {
      expect(MunicipalityService.existsMunicipality("13101")).toBe(true);
    });

    it("存在しない市区町村の場合falseを返す", () => {
      expect(MunicipalityService.existsMunicipality("99999")).toBe(false);
    });
  });

  describe("getDesignatedCityWards", () => {
    it("政令指定都市の区を取得できる", () => {
      const wards = MunicipalityService.getDesignatedCityWards("01100");
      expect(wards.length).toBeGreaterThan(0);
      wards.forEach((ward) => {
        expect(ward.type).toBe("ward");
        expect(ward.parentCode).toBe("01100");
      });
    });

    it("存在しない市の場合空配列を返す", () => {
      const wards = MunicipalityService.getDesignatedCityWards("99999");
      expect(wards).toHaveLength(0);
    });
  });

  describe("getParentCity", () => {
    it("政令指定都市の区の親市を取得できる", () => {
      const parent = MunicipalityService.getParentCity("01101");
      expect(parent).not.toBeNull();
      expect(parent?.code).toBe("01100");
    });

    it("一般市の場合はnullを返す", () => {
      const parent = MunicipalityService.getParentCity("01202");
      expect(parent).toBeNull();
    });
  });

  describe("getCount", () => {
    it("市区町村数を取得できる", () => {
      const count = MunicipalityService.getCount();
      expect(count).toBeGreaterThan(1900);
    });
  });

  describe("getCountByPrefecture", () => {
    it("都道府県ごとの市区町村数を取得できる", () => {
      const counts = MunicipalityService.getCountByPrefecture();
      expect(counts["13"]).toBeGreaterThan(0);
      expect(counts["01"]).toBeGreaterThan(0);
    });
  });

  describe("getCountByType", () => {
    it("タイプ別の市区町村数を取得できる", () => {
      const counts = MunicipalityService.getCountByType();
      expect(counts.city).toBeGreaterThan(0);
      expect(counts.ward).toBeGreaterThan(0);
      expect(counts.town).toBeGreaterThan(0);
      expect(counts.village).toBeGreaterThan(0);
    });
  });
});
