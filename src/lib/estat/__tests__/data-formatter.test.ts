import { describe, it, expect, beforeAll } from "vitest";
import { EstatDataFormatter } from "../data-formatter";
import { EstatStatsDataResponse } from "@/types/estat";
import * as fs from "fs";
import * as path from "path";

// 実際のデータファイルを読み込み
const loadEstatResponse = (): EstatStatsDataResponse => {
  const filePath = path.join(__dirname, "test-data", "estat-response.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContent) as EstatStatsDataResponse;
};

// 変換結果をJSONファイルとして出力
const saveFormattedData = (data: any, filename: string) => {
  const outputDir = path.join(__dirname, "output");

  // 出力ディレクトリが存在しない場合は作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`変換結果を保存しました: ${outputPath}`);
};

describe("EstatDataFormatter", () => {
  let estatResponse: EstatStatsDataResponse;

  beforeAll(() => {
    // テスト開始前に実際のデータを読み込み
    estatResponse = loadEstatResponse();
  });

  describe("formatCategories", () => {
    it("should format categories correctly and save to file", () => {
      const result = EstatDataFormatter.formatCategories(estatResponse);

      // 変換結果をファイルに保存
      saveFormattedData(result, "formatted-categories.json");

      // 基本的な検証
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        console.log(`カテゴリ数: ${result.length}`);
        console.log(`最初のカテゴリ:`, result[0]);
      }
    });
  });

  describe("formatAreas", () => {
    it("should format areas correctly and save to file", () => {
      const result = EstatDataFormatter.formatAreas(estatResponse);

      // 変換結果をファイルに保存
      saveFormattedData(result, "formatted-areas.json");

      // 基本的な検証
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        console.log(`地域数: ${result.length}`);
        console.log(`最初の地域:`, result[0]);
      }
    });
  });

  describe("formatYears", () => {
    it("should format years correctly and save to file", () => {
      const result = EstatDataFormatter.formatYears(estatResponse);

      // 変換結果をファイルに保存
      saveFormattedData(result, "formatted-years.json");

      // 基本的な検証
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        console.log(`年度数: ${result.length}`);
        console.log(`最初の年度:`, result[0]);
      }
    });
  });

  describe("formatValues", () => {
    it("should format values correctly and save to file", () => {
      const result = EstatDataFormatter.formatValues(estatResponse);

      // 変換結果をファイルに保存
      saveFormattedData(result, "formatted-values.json");

      // 基本的な検証
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        console.log(`値データ数: ${result.length}`);
        console.log(`最初の値データ:`, result[0]);
      }
    });

    it("should use category map when provided", () => {
      const categories = EstatDataFormatter.formatCategories(estatResponse);
      const categoryMap = new Map(categories.map((cat) => [cat.code, cat]));

      const result = EstatDataFormatter.formatValues(
        estatResponse,
        categoryMap
      );

      // 変換結果をファイルに保存
      saveFormattedData(result, "formatted-values-with-category-map.json");

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("formatAll", () => {
    it("should format all data correctly and save to file", () => {
      const result = EstatDataFormatter.formatAll(estatResponse);

      // 変換結果をファイルに保存
      saveFormattedData(result, "formatted-all-data.json");

      // 基本的な検証
      expect(result).toBeDefined();
      expect(result.tableInfo).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(result.areas).toBeDefined();
      expect(result.years).toBeDefined();
      expect(result.values).toBeDefined();
      expect(result.summary).toBeDefined();

      console.log(`完全な変換結果:`);
      console.log(`- カテゴリ数: ${result.categories.length}`);
      console.log(`- 地域数: ${result.areas.length}`);
      console.log(`- 年度数: ${result.years.length}`);
      console.log(`- 値データ数: ${result.values.length}`);
      console.log(`- 総データ数: ${result.summary.totalNumber}`);
    });
  });
});
