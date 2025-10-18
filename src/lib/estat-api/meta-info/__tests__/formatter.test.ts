import { describe, it, expect, beforeAll } from "vitest";
import { EstatMetaInfoFormatter } from "../formatter";
import type { EstatMetaInfoResponse } from "../../types";
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
      const tableInfo = EstatMetaInfoFormatter.extractTableInfo(minimalResponse);

      expect(tableInfo.id).toBe("0000010101");
      expect(tableInfo.title).toBe("Ａ　人口・世帯");
      expect(tableInfo.statName).toBe("社会・人口統計体系");
    });

    it("メタ情報が不足している場合はエラーを投げる", () => {
      const invalidResponse = {
        GET_META_INFO: {
          RESULT: { STATUS: 0 },
          PARAMETER: {},
          METADATA_INF: {}
        }
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
      const categories = EstatMetaInfoFormatter.extractCategories(minimalResponse);

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
      const areas = EstatMetaInfoFormatter.extractAreaHierarchy(minimalResponse);

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
      const parsed = EstatMetaInfoFormatter.parseCompleteMetaInfo(minimalResponse);

      expect(parsed).toBeDefined();
      expect(parsed.tableInfo).toBeDefined();
      expect(parsed.dimensions).toBeDefined();
      expect(parsed.dimensions.categories).toBeInstanceOf(Array);
      expect(parsed.dimensions.areas).toBeDefined();
      expect(parsed.dimensions.timeAxis).toBeDefined();
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
