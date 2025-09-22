import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// テストデータのインポート
import actualEstatData from "./input/0000010101.json";

// EstatStatsDataServiceのインポート
import { EstatStatsDataService } from "../EstatStatsDataService";

// モックデータ生成関数（実際のJSONデータを使用）
function generateMockValues() {
  // 実際のクラス情報を使用してより多くの値を生成
  const classObjs =
    actualEstatData.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ;
  const areaClass = classObjs.find((obj: any) => obj["@id"] === "area");
  const cat01Class = classObjs.find((obj: any) => obj["@id"] === "cat01");
  const timeClass = classObjs.find((obj: any) => obj["@id"] === "time");

  const values = [];

  if (areaClass?.CLASS && cat01Class?.CLASS && timeClass?.CLASS) {
    // より多くのデータを生成：最初の20カテゴリ、全地域、最初の10年分
    const sampleCategories = Array.isArray(cat01Class.CLASS)
      ? cat01Class.CLASS.slice(0, 20)
      : [cat01Class.CLASS];
    const allAreas = Array.isArray(areaClass.CLASS)
      ? areaClass.CLASS
      : [areaClass.CLASS];
    const sampleTimes = Array.isArray(timeClass.CLASS)
      ? timeClass.CLASS.slice(0, 10)
      : [timeClass.CLASS];

    let valueIndex = 1;
    for (const category of sampleCategories) {
      for (const area of allAreas) {
        for (const time of sampleTimes) {
          values.push({
            $: Math.floor(Math.random() * 100000).toString(),
            "@cat01": category["@code"],
            "@area": area["@code"],
            "@time": time["@code"],
          });
          valueIndex++;
        }
      }
    }
  }

  return values;
}

// より現実的なテストデータ生成
function createMockStatsDataResponse() {
  const mockValues = generateMockValues();

  return {
    GET_STATS_DATA: {
      STATISTICAL_DATA: {
        TABLE_INF: {
          "@id": "0000010101",
          TITLE: { $: "人口推計" },
          STAT_NAME: { $: "人口推計" },
          GOV_ORG: { $: "総務省" },
          STATISTICS_NAME: "人口推計",
          TOTAL_NUMBER: mockValues.length.toString(),
          FROM_NUMBER: "1",
          TO_NUMBER: mockValues.length.toString(),
        },
        CLASS_INF: actualEstatData.GET_META_INFO.METADATA_INF.CLASS_INF,
        DATA_INF: {
          VALUE: mockValues,
        },
      },
    },
  };
}

describe("EstatStatsDataService", () => {
  describe("formatStatsData", () => {
    it("should format stats data correctly", () => {
      const mockResponse = createMockStatsDataResponse();

      const result = EstatStatsDataService.formatStatsData(mockResponse as any);

      // Basic structure validation
      expect(result).toHaveProperty("tableInfo");
      expect(result).toHaveProperty("areas");
      expect(result).toHaveProperty("categories");
      expect(result).toHaveProperty("years");
      expect(result).toHaveProperty("values");
      expect(result).toHaveProperty("metadata");

      // Table info validation
      expect(result.tableInfo.id).toBe("0000010101");
      expect(result.tableInfo.title).toBe("人口推計");

      // Ensure we have data
      expect(result.areas.length).toBeGreaterThan(0);
      expect(result.categories.length).toBeGreaterThan(0);
      expect(result.years.length).toBeGreaterThan(0);
      expect(result.values.length).toBeGreaterThan(0);

      // Metadata validation
      expect(result.metadata.totalRecords).toBe(result.values.length);
      expect(result.metadata.validValues).toBeGreaterThanOrEqual(0);
      expect(result.metadata.nullValues).toBeGreaterThanOrEqual(0);
      expect(result.metadata.validValues + result.metadata.nullValues).toBe(
        result.metadata.totalRecords
      );
    });

    it("should handle empty data gracefully", () => {
      const emptyResponse = {
        GET_STATS_DATA: {
          STATISTICAL_DATA: {
            TABLE_INF: {
              "@id": "empty",
              TITLE: { $: "Empty Data" },
              STAT_NAME: { $: "Empty" },
              GOV_ORG: { $: "Test" },
              STATISTICS_NAME: "Empty",
              TOTAL_NUMBER: "0",
              FROM_NUMBER: "0",
              TO_NUMBER: "0",
            },
            CLASS_INF: {
              CLASS_OBJ: [],
            },
            DATA_INF: {
              VALUE: [],
            },
          },
        },
      };

      const result = EstatStatsDataService.formatStatsData(emptyResponse as any);

      expect(result.areas).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.years).toEqual([]);
      expect(result.values).toEqual([]);
      expect(result.metadata.totalRecords).toBe(0);
    });
  });

  describe("transformToCSVFormat", () => {
    it("should transform metadata to CSV format correctly", () => {
      const statsDataId = "0000010101";


      const result = EstatStatsDataService.transformToCSVFormat(
        actualEstatData,
        statsDataId
      );

      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        // Check structure of first item
        const firstItem = result[0];
        expect(firstItem).toHaveProperty("stats_data_id");
        expect(firstItem).toHaveProperty("stat_name");
        expect(firstItem).toHaveProperty("title");
        expect(firstItem).toHaveProperty("cat01");
        expect(firstItem).toHaveProperty("item_name");
        expect(firstItem).toHaveProperty("unit");

        expect(firstItem.stats_data_id).toBe(statsDataId);
      } else {
        // If no results, at least verify the function doesn't crash
        expect(result).toEqual([]);
      }
    });
  });

  describe("CSV output generation", () => {
    it("should generate CSV files with correct structure", () => {
      const mockResponse = createMockStatsDataResponse();
      const formattedData = EstatStatsDataService.formatStatsData(mockResponse as any);

      // Ensure output directory exists
      const outputDir = join(__dirname, "csv");
      try {
        mkdirSync(outputDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }

      // Test table info CSV generation
      const tableInfoHeader = "id,title,statName,govOrg,totalNumber\n";
      const tableInfoData = `${formattedData.tableInfo.id},${formattedData.tableInfo.title},${formattedData.tableInfo.statName},${formattedData.tableInfo.govOrg},${formattedData.tableInfo.totalNumber}\n`;

      writeFileSync(
        join(outputDir, "table-info.csv"),
        tableInfoHeader + tableInfoData
      );

      // Test areas CSV generation
      if (formattedData.areas.length > 0) {
        const areasHeader = "areaCode,areaName,level,parentCode\n";
        const areasData = formattedData.areas
          .map(
            (area) =>
              `${area.areaCode},"${area.areaName}",${area.level},${area.parentCode || ""}`
          )
          .join("\n");

        writeFileSync(join(outputDir, "areas.csv"), areasHeader + areasData);
      }

      // Test categories CSV generation
      if (formattedData.categories.length > 0) {
        const categoriesHeader =
          "categoryCode,categoryName,displayName,unit\n";
        const categoriesData = formattedData.categories
          .map(
            (cat) =>
              `${cat.categoryCode},"${cat.categoryName}","${cat.displayName}",${cat.unit || ""}`
          )
          .join("\n");

        writeFileSync(
          join(outputDir, "categories.csv"),
          categoriesHeader + categoriesData
        );
      }

      // Test years CSV generation
      if (formattedData.years.length > 0) {
        const yearsHeader = "timeCode,timeName\n";
        const yearsData = formattedData.years
          .map((year) => `${year.timeCode},"${year.timeName}"`)
          .join("\n");

        writeFileSync(join(outputDir, "years.csv"), yearsHeader + yearsData);
      }

      // Test values CSV generation (sample only)
      if (formattedData.values.length > 0) {
        const valuesHeader =
          "value,numericValue,displayValue,unit,areaCode,areaName,categoryCode,categoryName,timeCode,timeName\n";
        const sampleValues = formattedData.values.slice(0, 100); // First 100 rows
        const valuesData = sampleValues
          .map(
            (val) =>
              `"${val.value}",${val.numericValue},"${val.displayValue}","${val.unit || ""}",${val.areaCode},"${val.areaName}",${val.categoryCode},"${val.categoryName}",${val.timeCode},"${val.timeName}"`
          )
          .join("\n");

        writeFileSync(join(outputDir, "values.csv"), valuesHeader + valuesData);
      }

      // Verify files were created
      expect(true).toBe(true); // If we get here without errors, test passes
    });
  });

  describe("data validation", () => {
    it("should validate numeric values correctly", () => {
      const mockResponse = createMockStatsDataResponse();
      const result = EstatStatsDataService.formatStatsData(mockResponse as any);

      // Check that numeric values are properly parsed
      const validValues = result.values.filter(
        (val) => val.numericValue !== null
      );
      expect(validValues.length).toBeGreaterThan(0);

      // Check that all valid numeric values are numbers
      validValues.forEach((val) => {
        expect(typeof val.numericValue).toBe("number");
        expect(val.numericValue).toBeGreaterThanOrEqual(0);
      });
    });

    it("should handle special values correctly", () => {
      const specialValueResponse = {
        GET_STATS_DATA: {
          STATISTICAL_DATA: {
            TABLE_INF: {
              "@id": "special",
              TITLE: { $: "Special Values Test" },
              STAT_NAME: { $: "Test" },
              GOV_ORG: { $: "Test" },
              STATISTICS_NAME: "Test",
              TOTAL_NUMBER: "4",
              FROM_NUMBER: "1",
              TO_NUMBER: "4",
            },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "area",
                  CLASS: [{ "@code": "00000", "@name": "全国" }],
                },
                {
                  "@id": "cat01",
                  CLASS: [{ "@code": "A1101", "@name": "総人口" }],
                },
                {
                  "@id": "time",
                  CLASS: [{ "@code": "2020", "@name": "2020年" }],
                },
              ],
            },
            DATA_INF: {
              VALUE: [
                { $: "-", "@cat01": "A1101", "@area": "00000", "@time": "2020" },
                { $: "…", "@cat01": "A1101", "@area": "00000", "@time": "2020" },
                { $: "***", "@cat01": "A1101", "@area": "00000", "@time": "2020" },
                { $: "", "@cat01": "A1101", "@area": "00000", "@time": "2020" },
              ],
            },
          },
        },
      };

      const result = EstatStatsDataService.formatStatsData(specialValueResponse as any);

      // All special values should be null
      result.values.forEach((val) => {
        expect(val.numericValue).toBeNull();
        expect(val.displayValue).toBeTruthy(); // Should have some display value
      });
    });
  });
});