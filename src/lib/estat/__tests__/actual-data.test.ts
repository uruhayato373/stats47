import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// テストデータのインポート
import actualEstatData from "./test-data/0000010101-full.json";
import {
  expectedTransformedData,
  expectedTableInfo,
  expectedClassifications,
} from "./test-data/0000010101-expected";

// CSV保存用のヘルパー関数
function saveToCSV(
  data: any[],
  filename: string,
  outputDir: string = "./src/lib/estat/__tests__/csv"
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

// カテゴリ情報のみを抽出するヘルパー関数（データベース登録用）
function extractCategoryData(metadata: any) {
  try {
    const cat01Obj =
      metadata.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ.find(
        (obj: any) => obj["@id"] === "cat01"
      );

    if (!cat01Obj || !cat01Obj.CLASS) {
      return [];
    }

    const classes = Array.isArray(cat01Obj.CLASS)
      ? cat01Obj.CLASS
      : [cat01Obj.CLASS];

    return classes.map((classItem: any) => ({
      stats_data_id: metadata.GET_META_INFO.PARAMETER.STATS_DATA_ID,
      stat_name: metadata.GET_META_INFO.METADATA_INF.TABLE_INF.STAT_NAME.$,
      title: metadata.GET_META_INFO.METADATA_INF.TABLE_INF.TITLE.$,
      cat01: classItem["@code"] || null,
      item_name: classItem["@name"] || null,
      unit: classItem["@unit"] || null,
    }));
  } catch (error) {
    console.error("カテゴリデータ抽出エラー:", error);
    return [];
  }
}

describe("実際のe-Statデータ（0000010101）を使用したテスト", () => {
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

      expect(tableInf.STAT_NAME.$).toBe(expectedTableInfo.stat_name);
      expect(tableInf.TITLE.$).toBe(expectedTableInfo.title);
      expect(tableInf.GOV_ORG.$).toBe(expectedTableInfo.gov_org);
      expect(tableInf.CYCLE).toBe(expectedTableInfo.cycle);
      expect(tableInf.COLLECT_AREA).toBe(expectedTableInfo.collect_area);
      expect(tableInf.OVERALL_TOTAL_NUMBER).toBe(
        expectedTableInfo.overall_total_number
      );
    });
  });

  describe("分類情報の検証", () => {
    it("cat01分類が正しく設定されている", () => {
      const cat01Obj =
        actualEstatData.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ.find(
          (obj: any) => obj["@id"] === "cat01"
        ) as any;

      expect(cat01Obj).toBeDefined();
      expect(cat01Obj["@name"]).toBe(expectedClassifications.cat01.name);
      expect(cat01Obj.CLASS).toHaveLength(
        expectedClassifications.cat01.totalCount
      );

      // 最初のアイテムの確認
      const firstItem = cat01Obj.CLASS[0];
      expect(firstItem["@code"]).toBe(
        expectedClassifications.cat01.items[0].code
      );
      expect(firstItem["@name"]).toBe(
        expectedClassifications.cat01.items[0].name
      );
      expect(firstItem["@unit"]).toBe(
        expectedClassifications.cat01.items[0].unit
      );
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
      expect(areaObj["@name"]).toBe(expectedClassifications.area.name);
      expect(areaObj.CLASS).toHaveLength(
        expectedClassifications.area.totalCount
      );

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
      expect(timeObj["@name"]).toBe(expectedClassifications.time.name);
      expect(timeObj.CLASS).toHaveLength(
        expectedClassifications.time.totalCount
      );

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
      expect(expectedTransformedData).toHaveLength(2);

      const firstItem = expectedTransformedData[0];
      expect(firstItem.stats_data_id).toBe("0000010101");
      expect(firstItem.stat_name).toBe("社会・人口統計体系");
      expect(firstItem.title).toBe("Ａ　人口・世帯");
      expect(firstItem.cat01).toBe("A140401");
      expect(firstItem.item_name).toBe("0～3歳人口（男）");
      expect(firstItem.unit).toBe("人");
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

  describe("CSVデータの保存", () => {
    it("完全なデータからカテゴリ情報のみを抽出してデータベース登録用のCSVとして保存できる", () => {
      // 完全なデータからカテゴリ情報（cat01分類）のみを抽出
      const categoryData = extractCategoryData(actualEstatData);

      expect(categoryData).toBeDefined();
      expect(Array.isArray(categoryData)).toBe(true);
      expect(categoryData.length).toBe(576); // 576個のcat01項目

      // CSVとして保存
      const csvFilename = "0000010101-full-category-db-ready.csv";
      const savedPath = saveToCSV(categoryData, csvFilename);

      expect(savedPath).toBeDefined();
      expect(savedPath).toContain(csvFilename);

      // データの構造を確認（データベース登録用の形式）
      const firstItem = categoryData[0];
      expect(firstItem).toHaveProperty("stats_data_id");
      expect(firstItem).toHaveProperty("stat_name");
      expect(firstItem).toHaveProperty("title");
      expect(firstItem).toHaveProperty("cat01");
      expect(firstItem).toHaveProperty("item_name");
      expect(firstItem).toHaveProperty("unit");

      // データベース登録用の形式であることを確認
      expect(Object.keys(firstItem)).toEqual([
        "stats_data_id",
        "stat_name",
        "title",
        "cat01",
        "item_name",
        "unit",
      ]);

      // 最初の項目の内容確認
      expect(firstItem.stats_data_id).toBe("0000010101");
      expect(firstItem.stat_name).toBe("社会・人口統計体系");
      expect(firstItem.title).toBe("Ａ　人口・世帯");
      expect(firstItem.cat01).toBe("A1101");
      expect(firstItem.item_name).toBe("A1101_総人口");
      expect(firstItem.unit).toBe("人");

      console.log(
        `完全なカテゴリ情報抽出完了: ${categoryData.length}件のデータをデータベース登録用CSVに保存しました`
      );
      console.log(`CSV形式: ${Object.keys(firstItem).join(", ")}`);
      console.log(`最初の項目: ${firstItem.cat01} - ${firstItem.item_name}`);
    });
  });
});
