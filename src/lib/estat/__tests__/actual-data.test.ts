import { describe, it, expect } from "vitest";

// テストデータのインポート
import actualEstatData from "./test-data/0000010101.json";
import {
  expectedTransformedData,
  expectedTableInfo,
  expectedClassifications,
} from "./test-data/0000010101-expected";

describe("実際のe-Statデータ（0000010101）を使用したテスト", () => {
  describe("データの読み込み", () => {
    it("実際のデータが正しく読み込まれる", () => {
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
        expectedClassifications.cat01.items.length
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

    it("地域分類が正しく設定されている", () => {
      const areaObj =
        actualEstatData.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ.find(
          (obj: any) => obj["@id"] === "area"
        ) as any;

      expect(areaObj).toBeDefined();
      expect(areaObj["@name"]).toBe(expectedClassifications.area.name);
      expect(areaObj.CLASS).toHaveLength(
        expectedClassifications.area.items.length
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
        expectedClassifications.time.items.length
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
          expect(item["@unit"]).toBe("人"); // 人口データなので単位は「人」
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
});
