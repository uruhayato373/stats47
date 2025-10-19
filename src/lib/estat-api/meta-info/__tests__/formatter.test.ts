import { describe, it, expect, beforeAll } from "vitest";
import { EstatMetaInfoFormatter } from "../formatter";
import type {
  EstatMetaInfoResponse,
  DimensionSelectOptions,
} from "../../types";
import { mockMetaInfoResponse, minimalMetaInfoResponse } from "./fixtures";

describe("EstatMetaInfoFormatter", () => {
  let fullResponse: EstatMetaInfoResponse;
  let minimalResponse: EstatMetaInfoResponse;

  beforeAll(() => {
    fullResponse = mockMetaInfoResponse;
    minimalResponse = minimalMetaInfoResponse;
  });

  describe("extractTableInfo", () => {
    it("統計表の基本情報を正しく抽出する", () => {
      const tableInfo = EstatMetaInfoFormatter.extractTableInfo(fullResponse);

      expect(tableInfo).toBeDefined();
      expect(tableInfo.id).toBe("0000010101");
      expect(tableInfo.title).toBe("Ａ　人口・世帯");
      expect(tableInfo.statName).toBe("社会・人口統計体系");
      expect(tableInfo.organization).toBe("総務省");
      expect(tableInfo.statisticsName).toBe("都道府県データ 基礎データ");
    });

    it("最小限のデータでも正しく抽出する", () => {
      const tableInfo =
        EstatMetaInfoFormatter.extractTableInfo(minimalResponse);

      expect(tableInfo.id).toBe("0000010101");
      expect(tableInfo.title).toBe("Ａ　人口・世帯");
      expect(tableInfo.statName).toBe("社会・人口統計体系");
    });

    it("メタ情報が不足している場合はエラーを投げる", () => {
      const invalidResponse = {
        GET_META_INFO: {
          RESULT: { STATUS: 0 },
          PARAMETER: {},
          METADATA_INF: {},
        },
      } as EstatMetaInfoResponse;

      expect(() => {
        EstatMetaInfoFormatter.extractTableInfo(invalidResponse);
      }).toThrow("統計表情報が見つかりません");
    });
  });

  describe("extractCategories", () => {
    it("カテゴリ情報を正しく抽出する", () => {
      const categories = EstatMetaInfoFormatter.extractCategories(fullResponse);

      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);

      const firstCategory = categories[0];
      expect(firstCategory).toHaveProperty("id");
      expect(firstCategory).toHaveProperty("name");
    });

    it("最小限のデータでも正しく抽出する", () => {
      const categories =
        EstatMetaInfoFormatter.extractCategories(minimalResponse);

      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("extractAreaHierarchy", () => {
    it("地域階層情報を正しく抽出する", () => {
      const areas = EstatMetaInfoFormatter.extractAreaHierarchy(fullResponse);

      expect(areas).toBeDefined();
      expect(Array.isArray(areas)).toBe(true);
    });

    it("最小限のデータでも正しく抽出する", () => {
      const areas =
        EstatMetaInfoFormatter.extractAreaHierarchy(minimalResponse);

      expect(areas).toBeDefined();
      expect(Array.isArray(areas)).toBe(true);
    });
  });

  describe("extractTimeAxis", () => {
    it("時間軸情報を正しく抽出する", () => {
      const timeAxis = EstatMetaInfoFormatter.extractTimeAxis(fullResponse);

      expect(timeAxis).toBeDefined();
      expect(timeAxis).toHaveProperty("availableYears");
      expect(timeAxis).toHaveProperty("formattedYears");
    });

    it("最小限のデータでも正しく抽出する", () => {
      const timeAxis = EstatMetaInfoFormatter.extractTimeAxis(minimalResponse);

      expect(timeAxis).toBeDefined();
      expect(timeAxis).toHaveProperty("availableYears");
      expect(timeAxis).toHaveProperty("formattedYears");
    });
  });

  describe("parseCompleteMetaInfo", () => {
    it("完全なメタ情報を正しく解析する", () => {
      const parsed = EstatMetaInfoFormatter.parseCompleteMetaInfo(fullResponse);

      expect(parsed).toBeDefined();
      expect(parsed.tableInfo).toBeDefined();
      expect(parsed.dimensions).toBeDefined();
      expect(parsed.dimensions.categories).toBeInstanceOf(Array);
      expect(parsed.dimensions.areas).toBeDefined();
      expect(parsed.dimensions.timeAxis).toBeDefined();
    });

    it("最小限のデータでも正しく解析する", () => {
      const parsed =
        EstatMetaInfoFormatter.parseCompleteMetaInfo(minimalResponse);

      expect(parsed).toBeDefined();
      expect(parsed.tableInfo).toBeDefined();
      expect(parsed.dimensions).toBeDefined();
      expect(parsed.dimensions.categories).toBeInstanceOf(Array);
      expect(parsed.dimensions.areas).toBeDefined();
      expect(parsed.dimensions.timeAxis).toBeDefined();
    });
  });

  describe("generateSelectOptions", () => {
    it("stats-data互換の選択肢を正しく生成する", () => {
      const options =
        EstatMetaInfoFormatter.generateSelectOptions(fullResponse);

      expect(options).toBeDefined();
      expect(options).toHaveProperty("area");
      expect(options).toHaveProperty("time");
      expect(Array.isArray(options.area)).toBe(true);
      expect(Array.isArray(options.time)).toBe(true);
    });

    it("最小限のデータでも正しく生成する", () => {
      const options =
        EstatMetaInfoFormatter.generateSelectOptions(minimalResponse);

      expect(options).toBeDefined();
      expect(options).toHaveProperty("area");
      expect(options).toHaveProperty("time");
      expect(Array.isArray(options.area)).toBe(true);
      expect(Array.isArray(options.time)).toBe(true);
    });

    it("stats-dataのFormattedValue.dimensionsと同じ構造を返す", () => {
      const options =
        EstatMetaInfoFormatter.generateSelectOptions(fullResponse);

      // 必須次元の存在確認
      expect(options.area).toBeDefined();
      expect(options.time).toBeDefined();

      // オプション次元の存在確認（存在する場合のみ）
      if (options.tab) {
        expect(Array.isArray(options.tab)).toBe(true);
      }

      // cat01-cat15の存在確認（存在する場合のみ）
      for (let i = 1; i <= 15; i++) {
        const catId = `cat${String(i).padStart(
          2,
          "0"
        )}` as keyof DimensionSelectOptions;
        if (options[catId]) {
          expect(Array.isArray(options[catId])).toBe(true);
        }
      }
    });

    it("都道府県フィルタリングが正しく動作する", () => {
      const options =
        EstatMetaInfoFormatter.generateSelectOptions(fullResponse);

      // 都道府県の選択肢が正しくフィルタリングされているか確認
      options.area.forEach((option) => {
        expect(option.value).toMatch(/^\d{5}$/); // 5桁の数字
        expect(option.value).toMatch(/000$/); // 末尾が000
        expect(option.value).not.toBe("00000"); // 全国コードは除外
      });
    });

    it("年次が降順でソートされている", () => {
      const options =
        EstatMetaInfoFormatter.generateSelectOptions(fullResponse);

      if (options.time.length > 1) {
        for (let i = 0; i < options.time.length - 1; i++) {
          expect(
            options.time[i].value.localeCompare(options.time[i + 1].value)
          ).toBeGreaterThan(0);
        }
      }
    });

    it("CLASS_OBJが存在しない場合は空の配列を返す", () => {
      const invalidResponse = {
        GET_META_INFO: {
          RESULT: { STATUS: 0 },
          PARAMETER: {},
          METADATA_INF: {
            TABLE_INF: {},
            CLASS_INF: {},
          },
        },
      } as EstatMetaInfoResponse;

      const options =
        EstatMetaInfoFormatter.generateSelectOptions(invalidResponse);

      expect(options).toEqual({ area: [], time: [] });
    });

    it("複数分類を持つ統計表で正しく動作する", () => {
      // cat01とcat02の両方を持つモックデータを作成
      const multiCategoryResponse = {
        ...fullResponse,
        GET_META_INFO: {
          ...fullResponse.GET_META_INFO,
          METADATA_INF: {
            ...fullResponse.GET_META_INFO.METADATA_INF,
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "area",
                  "@name": "地域",
                  CLASS: [
                    { "@code": "13000", "@name": "東京都" },
                    { "@code": "27000", "@name": "大阪府" },
                  ],
                },
                {
                  "@id": "time",
                  "@name": "時間",
                  CLASS: [
                    { "@code": "2020", "@name": "2020年" },
                    { "@code": "2021", "@name": "2021年" },
                  ],
                },
                {
                  "@id": "cat01",
                  "@name": "男女別",
                  CLASS: [
                    { "@code": "1", "@name": "男" },
                    { "@code": "2", "@name": "女" },
                  ],
                },
                {
                  "@id": "cat02",
                  "@name": "年齢別",
                  CLASS: [
                    { "@code": "1", "@name": "0-14歳" },
                    { "@code": "2", "@name": "15-64歳" },
                    { "@code": "3", "@name": "65歳以上" },
                  ],
                },
              ],
            },
          },
        },
      } as EstatMetaInfoResponse;

      const options = EstatMetaInfoFormatter.generateSelectOptions(
        multiCategoryResponse
      );

      expect(options.cat01).toBeDefined();
      expect(options.cat01).toHaveLength(2);
      expect(options.cat01![0]).toEqual({ value: "1", label: "男" });
      expect(options.cat01![1]).toEqual({ value: "2", label: "女" });

      expect(options.cat02).toBeDefined();
      expect(options.cat02).toHaveLength(3);
      expect(options.cat02![0]).toEqual({ value: "1", label: "0-14歳" });
      expect(options.cat02![1]).toEqual({ value: "2", label: "15-64歳" });
      expect(options.cat02![2]).toEqual({ value: "3", label: "65歳以上" });
    });
  });

  describe("エラーハンドリング", () => {
    it("無効なレスポンスでエラーを投げる", () => {
      const invalidResponse = {} as EstatMetaInfoResponse;

      expect(() => {
        EstatMetaInfoFormatter.parseCompleteMetaInfo(invalidResponse);
      }).toThrow();
    });
  });
});
