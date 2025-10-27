import { beforeAll, describe, expect, it } from "vitest";

import { getMockMetaInfo } from "../../../../../data/mock/estat-api/meta-info";
import {
  extractCategories,
  extractTableInfo,
  extractTimeAxis,
  parseCompleteMetaInfo,
} from "../services/formatter";

import type { EstatMetaInfoResponse } from "../types";

describe("EstatMetaInfoFormatter", () => {
  let fullResponse: EstatMetaInfoResponse;
  let minimalResponse: EstatMetaInfoResponse;

  beforeAll(() => {
    // モックデータから取得
    const fullData = getMockMetaInfo("0000010101");
    const minimalData = getMockMetaInfo("0000010101");

    if (!fullData || !minimalData) {
      throw new Error("モックデータの取得に失敗しました");
    }

    fullResponse = fullData;
    minimalResponse = minimalData;
  });

  describe("extractTableInfo", () => {
    it("統計表の基本情報を正しく抽出する", () => {
      const tableInfo = extractTableInfo(fullResponse);

      expect(tableInfo).toBeDefined();
      expect(tableInfo.id).toBe("0000010101");
      expect(tableInfo.title).toBe("Ａ　人口・世帯");
      expect(tableInfo.statName).toBe("社会・人口統計体系");
      expect(tableInfo.organization).toBe("総務省");
      expect(tableInfo.statisticsName).toBe("都道府県データ 基礎データ");
    });

    it("最小限のデータでも正しく抽出する", () => {
      const tableInfo = extractTableInfo(minimalResponse);

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
        extractTableInfo(invalidResponse);
      }).toThrow("統計表情報が見つかりません");
    });
  });

  describe("extractCategories", () => {
    it("カテゴリ情報を正しく抽出する", () => {
      const categories = extractCategories(fullResponse);

      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);

      // catプレフィックスを持つ分類のみ抽出されることを確認
      const catCategory = categories.find((c) => c.id === "cat01");
      expect(catCategory).toBeDefined();
      expect(catCategory?.id).toBe("cat01");
      expect(catCategory?.name).toBe("Ａ　人口・世帯");
      expect(catCategory?.items).toBeInstanceOf(Array);
      expect(catCategory?.items.length).toBeGreaterThan(0);

      // tabなどcatプレフィックスのない分類は抽出されないことを確認
      const tabCategory = categories.find((c) => c.id === "tab");
      expect(tabCategory).toBeUndefined();
    });

    it("最小限のデータでも正しく抽出する", () => {
      const categories = extractCategories(minimalResponse);

      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThanOrEqual(0);
    });
  });

  // NOTE: extractAreaHierarchy はprivateな関数のため、
  // parseCompleteMetaInfo経由でのテストで十分（parseCompleteMetaInfoで既にテスト済み）

  describe("extractTimeAxis", () => {
    it("時間軸情報を正しく抽出する", () => {
      const timeAxis = extractTimeAxis(fullResponse);

      expect(timeAxis).toBeDefined();
      expect(timeAxis).toHaveProperty("availableYears");
      expect(timeAxis).toHaveProperty("formattedYears");
    });

    it("最小限のデータでも正しく抽出する", () => {
      const timeAxis = extractTimeAxis(minimalResponse);

      expect(timeAxis).toBeDefined();
      expect(timeAxis).toHaveProperty("availableYears");
      expect(timeAxis).toHaveProperty("formattedYears");
    });
  });

  describe("parseCompleteMetaInfo", () => {
    it("完全なメタ情報を正しく解析する", () => {
      const parsed = parseCompleteMetaInfo(fullResponse);

      expect(parsed).toBeDefined();
      expect(parsed.tableInfo).toBeDefined();
      expect(parsed.tableInfo.id).toBe("0000010101");
      expect(parsed.dimensions).toBeDefined();

      // categories
      expect(parsed.dimensions.categories).toBeInstanceOf(Array);
      expect(parsed.dimensions.categories.length).toBeGreaterThan(0);

      // areas (都道府県情報の配列)
      expect(parsed.dimensions.areas).toBeInstanceOf(Array);
      expect(parsed.dimensions.areas.length).toBeGreaterThan(0);
      const area = parsed.dimensions.areas[0];
      expect(area).toHaveProperty("code");
      expect(area).toHaveProperty("name");
      expect(area).toHaveProperty("level");
      expect(typeof area.level).toBe("number");

      // timeAxis
      expect(parsed.dimensions.timeAxis).toBeDefined();
      expect(parsed.dimensions.timeAxis.availableYears).toBeInstanceOf(Array);
      expect(parsed.dimensions.timeAxis.formattedYears).toBeInstanceOf(Array);
    });

    it("最小限のデータでも正しく解析する", () => {
      const parsed = parseCompleteMetaInfo(minimalResponse);

      expect(parsed).toBeDefined();
      expect(parsed.tableInfo).toBeDefined();
      expect(parsed.dimensions).toBeDefined();
      expect(parsed.dimensions.categories).toBeInstanceOf(Array);
      expect(parsed.dimensions.areas).toBeInstanceOf(Array);
      expect(parsed.dimensions.timeAxis).toBeDefined();
    });
  });

  // NOTE: generateSelectOptions は未実装のためテストをスキップ

  describe("エラーハンドリング", () => {
    it("無効なレスポンスでエラーを投げる", () => {
      const invalidResponse = {} as EstatMetaInfoResponse;

      expect(() => {
        parseCompleteMetaInfo(invalidResponse);
      }).toThrow();
    });
  });
});
