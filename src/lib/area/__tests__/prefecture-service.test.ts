/**
 * PrefectureServiceのユニットテスト
 */

import { describe, it, expect } from "vitest";
import { PrefectureService } from "../services/prefecture-service";

describe("PrefectureService", () => {
  describe("getAllPrefectures", () => {
    it("全47都道府県を取得できる", () => {
      const prefectures = PrefectureService.getAllPrefectures();
      expect(prefectures).toHaveLength(47);
    });

    it("取得した都道府県にprefCodeとprefNameが含まれる", () => {
      const prefectures = PrefectureService.getAllPrefectures();
      const hokkaido = prefectures[0];

      expect(hokkaido).toHaveProperty("prefCode");
      expect(hokkaido).toHaveProperty("prefName");
    });
  });

  describe("getPrefectureByCode", () => {
    it("5桁コードから都道府県を取得できる", () => {
      const pref = PrefectureService.getPrefectureByCode("01000");
      expect(pref).not.toBeNull();
      expect(pref?.prefName).toBe("北海道");
    });

    it("2桁コードから都道府県を取得できる", () => {
      const pref = PrefectureService.getPrefectureByCode("01");
      expect(pref).not.toBeNull();
      expect(pref?.prefName).toBe("北海道");
    });

    it("東京都を取得できる", () => {
      const pref = PrefectureService.getPrefectureByCode("13");
      expect(pref?.prefName).toBe("東京都");
    });

    it("大阪府を取得できる", () => {
      const pref = PrefectureService.getPrefectureByCode("27000");
      expect(pref?.prefName).toBe("大阪府");
    });

    it("無効なコードの場合nullを返す", () => {
      const pref = PrefectureService.getPrefectureByCode("99");
      expect(pref).toBeNull();
    });

    it("存在しないコードの場合nullを返す", () => {
      const pref = PrefectureService.getPrefectureByCode("48000");
      expect(pref).toBeNull();
    });
  });

  describe("getPrefectureByName", () => {
    it("都道府県名から都道府県を取得できる", () => {
      const pref = PrefectureService.getPrefectureByName("北海道");
      expect(pref).not.toBeNull();
      expect(pref?.prefCode).toBe("01000");
    });

    it("東京都を名前から取得できる", () => {
      const pref = PrefectureService.getPrefectureByName("東京都");
      expect(pref?.prefCode).toBe("13000");
    });

    it("存在しない名前の場合nullを返す", () => {
      const pref = PrefectureService.getPrefectureByName("存在しない県");
      expect(pref).toBeNull();
    });
  });

  describe("getPrefectureNameFromCode", () => {
    it("コードから都道府県名を取得できる", () => {
      const name = PrefectureService.getPrefectureNameFromCode("01");
      expect(name).toBe("北海道");
    });

    it("5桁コードから都道府県名を取得できる", () => {
      const name = PrefectureService.getPrefectureNameFromCode("13000");
      expect(name).toBe("東京都");
    });

    it("無効なコードの場合nullを返す", () => {
      const name = PrefectureService.getPrefectureNameFromCode("99");
      expect(name).toBeNull();
    });
  });

  describe("getPrefectureCodeFromName", () => {
    it("都道府県名からコードを取得できる", () => {
      const code = PrefectureService.getPrefectureCodeFromName("北海道");
      expect(code).toBe("01");
    });

    it("存在しない名前の場合nullを返す", () => {
      const code = PrefectureService.getPrefectureCodeFromName("存在しない県");
      expect(code).toBeNull();
    });
  });

  describe("getAllRegions", () => {
    it("全地域ブロックを取得できる", () => {
      const regions = PrefectureService.getAllRegions();
      expect(regions.length).toBeGreaterThan(0);
    });

    it("地域ブロックにkeyとnameが含まれる", () => {
      const regions = PrefectureService.getAllRegions();
      const region = regions[0];

      expect(region).toHaveProperty("key");
      expect(region).toHaveProperty("name");
      expect(region).toHaveProperty("prefectures");
    });
  });

  describe("getRegionByKey", () => {
    it("キーから地域ブロックを取得できる", () => {
      const region = PrefectureService.getRegionByKey("hokkaido-tohoku");
      expect(region).not.toBeNull();
      expect(region?.name).toBe("北海道・東北地方");
    });

    it("存在しないキーの場合nullを返す", () => {
      const region = PrefectureService.getRegionByKey("invalid-key");
      expect(region).toBeNull();
    });
  });

  describe("getRegionByPrefecture", () => {
    it("都道府県から地域ブロックを取得できる", () => {
      const region = PrefectureService.getRegionByPrefecture("01");
      expect(region).not.toBeNull();
      expect(region?.key).toBe("hokkaido-tohoku");
    });

    it("東京都の地域ブロックを取得できる", () => {
      const region = PrefectureService.getRegionByPrefecture("13000");
      expect(region).not.toBeNull();
      expect(region?.key).toBe("kanto-chubu");
    });
  });

  describe("getPrefecturesByRegion", () => {
    it("地域ブロック内の都道府県リストを取得できる", () => {
      const prefs = PrefectureService.getPrefecturesByRegion("hokkaido-tohoku");
      expect(prefs.length).toBeGreaterThan(0);
    });

    it("取得した都道府県に北海道が含まれる", () => {
      const prefs = PrefectureService.getPrefecturesByRegion("hokkaido-tohoku");
      const hokkaido = prefs.find((p) => p.prefName === "北海道");
      expect(hokkaido).toBeDefined();
    });
  });

  describe("searchPrefectures", () => {
    it("名前で部分一致検索できる", () => {
      const results = PrefectureService.searchPrefectures({ query: "北" });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((p) => p.prefName.includes("北"))).toBe(true);
    });

    it("コードで検索できる", () => {
      const results = PrefectureService.searchPrefectures({ query: "01" });
      expect(results.length).toBeGreaterThan(0);
    });

    it("地域ブロックでフィルタリングできる", () => {
      const results = PrefectureService.searchPrefectures({
        query: "",
        regionKey: "hokkaido-tohoku",
      });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("existsPrefecture", () => {
    it("存在する都道府県の場合trueを返す", () => {
      expect(PrefectureService.existsPrefecture("01")).toBe(true);
    });

    it("存在しない都道府県の場合falseを返す", () => {
      expect(PrefectureService.existsPrefecture("99")).toBe(false);
    });
  });

  describe("getPrefectureMap", () => {
    it("都道府県マップを取得できる", () => {
      const map = PrefectureService.getPrefectureMap();
      expect(Object.keys(map)).toHaveLength(47);
      expect(map["01"]).toBe("北海道");
      expect(map["13"]).toBe("東京都");
    });
  });

  describe("getPrefectureNameToCodeMap", () => {
    it("都道府県名→コードマップを取得できる", () => {
      const map = PrefectureService.getPrefectureNameToCodeMap();
      expect(Object.keys(map)).toHaveLength(47);
      expect(map["北海道"]).toBe("01");
      expect(map["東京都"]).toBe("13");
    });
  });
});
