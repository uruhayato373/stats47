import { describe, it, expect } from "vitest";

import { buildGeoshapeExternalUrl } from "../geoshape-url-builder";

describe("buildGeoshapeExternalUrl", () => {
  const baseUrl = "https://geoshape.ex.nii.ac.jp/city/topojson/20230101";

  describe("nationalタイプ", () => {
    it("都道府県URLを返す", () => {
      const result = buildGeoshapeExternalUrl({ areaType: "national" });

      expect(result).toBe(`${baseUrl}/jp_pref.l.topojson`);
    });

    it("wardModeパラメータを無視して都道府県URLを返す", () => {
      const result = buildGeoshapeExternalUrl({ areaType: "national", wardMode: "split" });

      expect(result).toBe(`${baseUrl}/jp_pref.l.topojson`);
    });
  });

  describe("prefectureタイプ", () => {
    it("都道府県URLを返す", () => {
      const result = buildGeoshapeExternalUrl({ areaType: "prefecture" });

      expect(result).toBe(`${baseUrl}/jp_pref.l.topojson`);
    });

    it("wardModeパラメータを無視して都道府県URLを返す", () => {
      const result = buildGeoshapeExternalUrl({ areaType: "prefecture", wardMode: "split" });

      expect(result).toBe(`${baseUrl}/jp_pref.l.topojson`);
    });
  });

  describe("cityタイプ", () => {
    describe("prefCode未指定（全国市区町村データ）", () => {
      describe("mergedモード", () => {
        it("prefCode未指定でmergedモードの市区町村URLを返す", () => {
          const result = buildGeoshapeExternalUrl({ areaType: "city", wardMode: "merged" });

          expect(result).toBe(`${baseUrl}/jp_city_dc.i.topojson`);
        });

        it("prefCode未指定でデフォルトのwardModeでmergedモードのURLを返す", () => {
          const result = buildGeoshapeExternalUrl({ areaType: "city" });

          expect(result).toBe(`${baseUrl}/jp_city_dc.i.topojson`);
        });
      });

      describe("splitモード", () => {
        it("prefCode未指定でsplitモードの市区町村URLを返す", () => {
          const result = buildGeoshapeExternalUrl({ areaType: "city", wardMode: "split" });

          expect(result).toBe(`${baseUrl}/jp_city.i.topojson`);
        });
      });
    });

    describe("prefCode指定（都道府県別データ）", () => {
      describe("mergedモード", () => {
        it("prefCodeが5桁形式（01000）でmergedモードの市区町村URLを返す", () => {
          const result = buildGeoshapeExternalUrl({ areaType: "city", prefCode: "01000", wardMode: "merged" });

          expect(result).toBe(`${baseUrl}/01/01_city_dc.i.topojson`);
        });

        it("prefCodeが5桁形式（47000）でmergedモードの市区町村URLを返す", () => {
          const result = buildGeoshapeExternalUrl({ areaType: "city", prefCode: "47000", wardMode: "merged" });

          expect(result).toBe(`${baseUrl}/47/47_city_dc.i.topojson`);
        });

        it("デフォルトのwardModeでmergedモードのURLを返す", () => {
          const result = buildGeoshapeExternalUrl({ areaType: "city", prefCode: "47000" });

          expect(result).toBe(`${baseUrl}/47/47_city_dc.i.topojson`);
        });
      });

      describe("splitモード", () => {
        it("prefCodeが5桁形式（28000）でsplitモードの市区町村URLを返す", () => {
          const result = buildGeoshapeExternalUrl({ areaType: "city", prefCode: "28000", wardMode: "split" });

          expect(result).toBe(`${baseUrl}/28/28_city.i.topojson`);
        });

        it("prefCodeが5桁形式（01000）でsplitモードの市区町村URLを返す", () => {
          const result = buildGeoshapeExternalUrl({ areaType: "city", prefCode: "01000", wardMode: "split" });

          expect(result).toBe(`${baseUrl}/01/01_city.i.topojson`);
        });
      });
    });
  });

  describe("URL形式の検証", () => {
    it("すべてのURLが正しいベースURLで始まる", () => {
      const results = [
        buildGeoshapeExternalUrl({ areaType: "national" }),
        buildGeoshapeExternalUrl({ areaType: "prefecture" }),
        buildGeoshapeExternalUrl({ areaType: "city", wardMode: "merged" }),
        buildGeoshapeExternalUrl({ areaType: "city", wardMode: "split" }),
        buildGeoshapeExternalUrl({ areaType: "city", prefCode: "01000", wardMode: "merged" }),
        buildGeoshapeExternalUrl({ areaType: "city", prefCode: "01000", wardMode: "split" }),
      ];

      results.forEach((url) => {
        expect(url).toMatch(/^https:\/\/geoshape\.ex\.nii\.ac\.jp\/city\/topojson\/20230101/);
      });
    });

    it("都道府県URLが正しい形式である", () => {
      const result = buildGeoshapeExternalUrl({ areaType: "prefecture" });

      expect(result).toBe(`${baseUrl}/jp_pref.l.topojson`);
    });

    it("市区町村URL（prefCode未指定、merged）が正しい形式である", () => {
      const result = buildGeoshapeExternalUrl({ areaType: "city", wardMode: "merged" });

      expect(result).toBe(`${baseUrl}/jp_city_dc.i.topojson`);
    });

    it("市区町村URL（prefCode未指定、split）が正しい形式である", () => {
      const result = buildGeoshapeExternalUrl({ areaType: "city", wardMode: "split" });

      expect(result).toBe(`${baseUrl}/jp_city.i.topojson`);
    });

    it("市区町村URL（prefCode指定、merged）が正しい形式である", () => {
      const result = buildGeoshapeExternalUrl({ areaType: "city", prefCode: "01000", wardMode: "merged" });

      expect(result).toMatch(/\/01\/01_city_dc\.i\.topojson$/);
    });

    it("市区町村URL（prefCode指定、split）が正しい形式である", () => {
      const result = buildGeoshapeExternalUrl({ areaType: "city", prefCode: "01000", wardMode: "split" });

      expect(result).toMatch(/\/01\/01_city\.i\.topojson$/);
    });

    it("5桁prefCode（47000）で正しい2桁コード（47）が抽出される", () => {
      const result = buildGeoshapeExternalUrl({ areaType: "city", prefCode: "47000", wardMode: "merged" });

      expect(result).toMatch(/\/47\/47_city_dc\.i\.topojson$/);
    });
  });
});
