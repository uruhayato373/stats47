import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// テストデータのインポート
import actualEstatData from "./input/0000010101.json";

// EstatDataFormatterのインポート
import { EstatDataFormatter } from "../EstatDataFormatter";

// CSV保存用のヘルパー関数
function saveToCSV(
  data: any[],
  filename: string,
  outputDir: string = "./src/lib/estat/response/__tests__/csv"
) {
  try {
    // 出力ディレクトリの作成
    mkdirSync(outputDir, { recursive: true });

    // CSVヘッダーの生成
    const headers = Object.keys(data[0] || {});
    const csvHeader = headers.join(",");

    // CSVデータの生成
    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // カンマや改行を含む値はダブルクォートで囲む
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes("\n") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    );

    // CSVファイルの作成
    const csvContent = [csvHeader, ...csvRows].join("\n");
    const filePath = join(outputDir, filename);
    writeFileSync(filePath, csvContent, "utf-8");

    console.log(`CSVファイルを保存しました: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("CSV保存エラー:", error);
    throw error;
  }
}

describe("EstatDataFormatter テスト", () => {
  describe("データの読み込み", () => {
    it("実際のデータが正しく読み込まれる", () => {
      expect(actualEstatData).toBeDefined();
      expect(actualEstatData.GET_META_INFO).toBeDefined();
      expect(actualEstatData.GET_META_INFO.PARAMETER.STATS_DATA_ID).toBe(
        "0000010101"
      );
    });

    it("完全なデータが正しく読み込まれる", () => {
      expect(actualEstatData).toBeDefined();
      expect(actualEstatData.GET_META_INFO).toBeDefined();
      expect(actualEstatData.GET_META_INFO.PARAMETER.STATS_DATA_ID).toBe(
        "0000010101"
      );
    });

    it("統計表の基本情報が正しく設定されている", () => {
      const tableInf = actualEstatData.GET_META_INFO.METADATA_INF.TABLE_INF;

      expect(tableInf.STAT_NAME.$).toBe("社会・人口統計体系");
      expect(tableInf.TITLE.$).toBe("Ａ　人口・世帯");
      expect(tableInf.GOV_ORG.$).toBe("総務省");
      expect(tableInf.CYCLE).toBe("年度次");
      expect(tableInf.COLLECT_AREA).toBe("全国");
      expect(tableInf.OVERALL_TOTAL_NUMBER).toBe(546720);
    });
  });

  describe("分類情報の検証", () => {
    it("cat01分類が正しく設定されている", () => {
      const cat01Obj =
        actualEstatData.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ.find(
          (obj: any) => obj["@id"] === "cat01"
        ) as any;

      expect(cat01Obj).toBeDefined();
      expect(cat01Obj["@name"]).toBe("Ａ　人口・世帯");
      expect(cat01Obj.CLASS).toHaveLength(576);

      // 最初のアイテムの確認
      const firstItem = cat01Obj.CLASS[0];
      expect(firstItem["@code"]).toBe("A1101");
      expect(firstItem["@name"]).toBe("A1101_総人口");
      expect(firstItem["@unit"]).toBe("人");
    });

    it("完全なデータのcat01分類が正しく設定されている", () => {
      const cat01Obj =
        actualEstatData.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ.find(
          (obj: any) => obj["@id"] === "cat01"
        ) as any;

      expect(cat01Obj).toBeDefined();
      expect(cat01Obj["@name"]).toBe("Ａ　人口・世帯");
      expect(cat01Obj.CLASS).toHaveLength(576); // 576個のcat01項目

      // 最初のアイテムの確認
      const firstItem = cat01Obj.CLASS[0];
      expect(firstItem["@code"]).toBe("A1101");
      expect(firstItem["@name"]).toBe("A1101_総人口");
      expect(firstItem["@unit"]).toBe("人");

      // 最後のアイテムの確認
      const lastItem = cat01Obj.CLASS[cat01Obj.CLASS.length - 1];
      expect(lastItem["@code"]).toBeDefined();
      expect(lastItem["@name"]).toBeDefined();
      expect(lastItem["@unit"]).toBeDefined(); // 単位は様々（人、組など）
    });

    it("地域分類が正しく設定されている", () => {
      const areaObj =
        actualEstatData.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ.find(
          (obj: any) => obj["@id"] === "area"
        ) as any;

      expect(areaObj).toBeDefined();
      expect(areaObj["@name"]).toBe("地域");
      expect(areaObj.CLASS).toHaveLength(48);

      // 全国の確認
      const nationalItem = areaObj.CLASS.find(
        (item: any) => item["@code"] === "00000"
      );
      expect(nationalItem).toBeDefined();
      expect(nationalItem["@name"]).toBe("全国");
    });

    it("時間分類が正しく設定されている", () => {
      const timeObj =
        actualEstatData.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ.find(
          (obj: any) => obj["@id"] === "time"
        ) as any;

      expect(timeObj).toBeDefined();
      expect(timeObj["@name"]).toBe("調査年");
      expect(timeObj.CLASS).toHaveLength(50);

      // 2020年度の確認
      const year2020Item = timeObj.CLASS.find(
        (item: any) => item["@code"] === "2020100000"
      );
      expect(year2020Item).toBeDefined();
      expect(year2020Item["@name"]).toBe("2020年度");
    });
  });

  describe("期待される変換結果の検証", () => {
    it("期待される変換結果の構造が正しい", () => {
      // 変換されたデータの確認（実際のデータに基づく）
      const cat01Obj =
        actualEstatData.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ.find(
          (obj: any) => obj["@id"] === "cat01"
        );

      const transformedData = Array.isArray(cat01Obj?.CLASS)
        ? cat01Obj.CLASS
        : cat01Obj?.CLASS
        ? [cat01Obj.CLASS]
        : [];

      expect(transformedData).toHaveLength(576);

      const firstItem = transformedData[0] as any;
      expect(firstItem["@code"]).toBe("A1101");
      expect(firstItem["@name"]).toBe("A1101_総人口");
      expect(firstItem["@unit"]).toBe("人");
    });

    it("cat01分類のアイテムが正しく抽出される", () => {
      const cat01Obj =
        actualEstatData.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ.find(
          (obj: any) => obj["@id"] === "cat01"
        ) as any;

      if (cat01Obj && cat01Obj.CLASS) {
        const cat01Items = cat01Obj.CLASS;

        // 各アイテムの構造確認
        cat01Items.forEach((item: any) => {
          expect(item).toHaveProperty("@code");
          expect(item).toHaveProperty("@name");
          expect(item).toHaveProperty("@unit");
          // 単位は多様（人、歳、組、世帯、％、‰、ｋｍ2、胎など）
          expect(item["@unit"]).toBeDefined();
        });

        // 特定のアイテムの存在確認
        const hasMaleItem = cat01Items.some((item: any) =>
          item["@name"].includes("男")
        );
        const hasFemaleItem = cat01Items.some((item: any) =>
          item["@name"].includes("女")
        );
        expect(hasMaleItem).toBe(true);
        expect(hasFemaleItem).toBe(true);
      }
    });
  });

  describe("データの整合性検証", () => {
    it("統計表の総データ数が正しい", () => {
      const totalNumber =
        actualEstatData.GET_META_INFO.METADATA_INF.TABLE_INF
          .OVERALL_TOTAL_NUMBER;
      expect(totalNumber).toBe(546720);
      expect(typeof totalNumber).toBe("number");
    });

    it("統計表の更新日が正しい形式", () => {
      const openDate =
        actualEstatData.GET_META_INFO.METADATA_INF.TABLE_INF.OPEN_DATE;
      const updatedDate =
        actualEstatData.GET_META_INFO.METADATA_INF.TABLE_INF.UPDATED_DATE;

      expect(openDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(updatedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("統計表の基本情報が一貫している", () => {
      const tableInf = actualEstatData.GET_META_INFO.METADATA_INF.TABLE_INF;

      // 統計表IDの一貫性
      expect(tableInf["@id"]).toBe("0000010101");
      expect(tableInf.TITLE["@no"]).toBe("0000010101");

      // 統計名とタイトルの一貫性
      expect(tableInf.STAT_NAME.$).toBe("社会・人口統計体系");
      expect(tableInf.TITLE.$).toBe("Ａ　人口・世帯");

      // 政府機関の確認
      expect(tableInf.GOV_ORG.$).toBe("総務省");
      expect(tableInf.GOV_ORG["@code"]).toBe("00200");
    });
  });

  describe("CSV出力テスト", () => {
    it("統計データを整形してCSVに保存する", () => {
      // テスト用のGET_STATS_DATA形式のモックデータを作成
      const mockStatsDataResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: "正常に終了しました。",
            DATE: "2025-08-14T09:27:36.165+09:00",
          },
          PARAMETER: {
            LANG: "J" as const,
            STATS_DATA_ID: "0000010101",
            DATA_FORMAT: "J" as const,
            METAGET_FLG: "Y" as const,
            CNT_GET_FLG: "N" as const,
            EXPLANATION_GET_FLG: "N" as const,
            ANNOTATION_GET_FLG: "N" as const,
            REPLACE_SP_CHARS: "0" as const,
          },
          STATISTICAL_DATA: {
            RESULT_INF: {
              TOTAL_NUMBER: 2400,
              FROM_NUMBER: 1,
              TO_NUMBER: 2400,
            },
            TABLE_INF: {
              "@id": "0000010101",
              STAT_NAME: {
                "@code": "00200502",
                $: "社会・人口統計体系",
              },
              GOV_ORG: {
                "@code": "00200",
                $: "総務省",
              },
              STATISTICS_NAME: "都道府県データ 基礎データ",
              STATISTICS_NAME_SPEC: {
                TABULATION_CATEGORY: "都道府県データ 基礎データ",
              },
              TITLE: {
                "@no": "0000010101",
                $: "Ａ　人口・世帯",
              },
              TITLE_SPEC: {
                TABLE_NAME: "Ａ　人口・世帯",
              },
              CYCLE: "年度次",
              SURVEY_DATE: "0",
              OPEN_DATE: "2025-06-30",
              SMALL_AREA: "0" as const,
              COLLECT_AREA: "全国",
              MAIN_CATEGORY: {
                "@code": "99",
                $: "その他",
              },
              SUB_CATEGORY: {
                "@code": "99",
                $: "その他",
              },
              OVERALL_TOTAL_NUMBER: 2400,
              UPDATED_DATE: "2025-06-30",
            },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "cat01" as const,
                  "@name": "人口",
                  CLASS: [
                    {
                      "@code": "A1101",
                      "@name": "総人口",
                      "@level": "1",
                      "@unit": "人",
                    },
                  ],
                },
                {
                  "@id": "area" as const,
                  "@name": "地域",
                  CLASS: [
                    {
                      "@code": "00000",
                      "@name": "全国",
                      "@level": "1",
                    },
                    {
                      "@code": "01000",
                      "@name": "北海道",
                      "@level": "2",
                    },
                    {
                      "@code": "02000",
                      "@name": "青森県",
                      "@level": "2",
                    },
                  ],
                },
                {
                  "@id": "time" as const,
                  "@name": "時間軸（調査年）",
                  CLASS: [
                    {
                      "@code": "2023000000",
                      "@name": "2023年",
                      "@level": "1",
                    },
                    {
                      "@code": "2022000000",
                      "@name": "2022年",
                      "@level": "1",
                    },
                  ],
                },
              ],
            },
            DATA_INF: {
              NOTE: [],
              VALUE: [
                {
                  "@tab": "cat01",
                  "@cat01": "A1101",
                  "@area": "00000",
                  "@time": "2023000000",
                  "@unit": "人",
                  $: "124947000",
                },
                {
                  "@tab": "cat01",
                  "@cat01": "A1101",
                  "@area": "01000",
                  "@time": "2023000000",
                  "@unit": "人",
                  $: "5184000",
                },
                {
                  "@tab": "cat01",
                  "@cat01": "A1101",
                  "@area": "02000",
                  "@time": "2023000000",
                  "@unit": "人",
                  $: "1200000",
                },
              ],
            },
          },
        },
      };

      // EstatDataFormatterでデータを整形
      const formattedData = EstatDataFormatter.formatStatsData(
        mockStatsDataResponse
      );

      // テーブル情報をCSVに保存
      const tableInfoCsv = [formattedData.tableInfo];
      const tableInfoPath = saveToCSV(tableInfoCsv, "table-info.csv");
      expect(tableInfoPath).toBeDefined();

      // 地域情報をCSVに保存（全データ）
      const areasCsv = formattedData.areas.map((area) => ({
        code: area.code,
        name: area.name,
        displayName: area.displayName,
        level: area.level,
        parentCode: area.parentCode || "",
      }));
      const areasPath = saveToCSV(areasCsv, "areas.csv");
      expect(areasPath).toBeDefined();

      // カテゴリ情報をCSVに保存（全データ）
      const categoriesCsv = formattedData.categories.map((category) => ({
        code: category.code,
        name: category.name,
        displayName: category.displayName,
        level: category.level,
        unit: category.unit || "",
      }));
      const categoriesPath = saveToCSV(categoriesCsv, "categories.csv");
      expect(categoriesPath).toBeDefined();

      // 年度情報をCSVに保存（全データ）
      const yearsCsv = formattedData.years.map((year) => ({
        code: year.code,
        year: year.year,
        displayName: year.displayName,
        fromDate: year.fromDate || "",
        toDate: year.toDate || "",
      }));
      const yearsPath = saveToCSV(yearsCsv, "years.csv");
      expect(yearsPath).toBeDefined();

      // 値データをCSVに保存（全データ）
      const valuesCsv = formattedData.values.map((value) => ({
        value: value.value,
        numericValue: value.numericValue || "",
        displayValue: value.displayValue,
        unit: value.unit || "",
        areaCode: value.areaCode || "",
        areaName: value.areaInfo?.displayName || "",
        yearCode: value.yearInfo?.code || "",
        year: value.yearInfo?.year || "",
        yearName: value.yearInfo?.displayName || "",
        categories: JSON.stringify(value.categories),
      }));
      const valuesPath = saveToCSV(valuesCsv, "values.csv");
      expect(valuesPath).toBeDefined();

      // メタデータはCSVに保存しない

      console.log("EstatDataFormatter テスト完了:");
      console.log(`- テーブル情報: ${tableInfoPath}`);
      console.log(`- 地域情報: ${areasPath} (${formattedData.areas.length}件)`);
      console.log(
        `- カテゴリ情報: ${categoriesPath} (${formattedData.categories.length}件)`
      );
      console.log(`- 年度情報: ${yearsPath} (${formattedData.years.length}件)`);
      console.log(
        `- 値データ: ${valuesPath} (${valuesCsv.length}件/全${formattedData.values.length}件)`
      );
    });
  });
});
