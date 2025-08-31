import { describe, it, expect } from "vitest";
import { EstatDataTransformer } from "../data-transformer";
import { EstatMetaInfoResponse } from "@/types/estat";
import actualMetadata from "./test-data/0000010101-full.json";

describe("EstatDataTransformer", () => {
  // 実際のe-Stat APIレスポンスデータを使用
  const metadata = actualMetadata as unknown as EstatMetaInfoResponse;

  // cat01分類のデータ数を取得するヘルパー関数
  const getCat01Count = () => {
    const cat01Obj =
      metadata.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ.find(
        (obj) => obj["@id"] === "cat01"
      );

    if (!cat01Obj?.CLASS) return 0;

    return Array.isArray(cat01Obj.CLASS) ? cat01Obj.CLASS.length : 1;
  };

  describe("extractCategoriesFromMetadata", () => {
    it("基本情報の行が正しく設定される", () => {
      const result =
        EstatDataTransformer.extractCategoriesFromMetadata(metadata);
      expect(result[0]).toEqual({
        stats_data_id: "0000010101",
        stat_name: "社会・人口統計体系",
        title: "Ａ　人口・世帯",
        cat01: null,
        item_name: null,
        unit: null,
      });
    });

    it("メタデータからカテゴリ情報を正しく抽出する", () => {
      const result =
        EstatDataTransformer.extractCategoriesFromMetadata(metadata);
      const dataRows = result.filter((r) => r.cat01 !== null);

      // 最初のcat01データを確認
      expect(dataRows[0].item_name).toBe("総人口");
      expect(dataRows[1].item_name).toBe("総人口（男）");
      expect(dataRows[2].item_name).toBe("総人口（女）");
      expect(dataRows[3].item_name).toBe("日本人人口");
      expect(dataRows[4].item_name).toBe("日本人人口（男）");
      expect(dataRows[5].item_name).toBe("日本人人口（女）");
      expect(dataRows[6].item_name).toBe("0～4歳人口");
    });

    it("cat01の値が正しく設定される", () => {
      const result =
        EstatDataTransformer.extractCategoriesFromMetadata(metadata);
      const dataRows = result.filter((r) => r.cat01 !== null);

      expect(dataRows[0].cat01).toBe("A1101");
      expect(dataRows[1].cat01).toBe("A110101");
      expect(dataRows[2].cat01).toBe("A110102");
      expect(dataRows[3].cat01).toBe("A1102");
      expect(dataRows[4].cat01).toBe("A110201");
      expect(dataRows[5].cat01).toBe("A110202");
      expect(dataRows[6].cat01).toBe("A1201");
    });

    it("基本情報が正しく設定される", () => {
      const result =
        EstatDataTransformer.extractCategoriesFromMetadata(metadata);
      result.forEach((item) => {
        expect(item.stats_data_id).toBe("0000010101");
        expect(item.stat_name).toBe("社会・人口統計体系");
        expect(item.title).toBe("Ａ　人口・世帯");
      });
    });

    it("単位が正しく設定される", () => {
      const result =
        EstatDataTransformer.extractCategoriesFromMetadata(metadata);
      const dataRows = result.filter((r) => r.cat01 !== null);

      expect(dataRows[0].unit).toBe("人");
      expect(dataRows[1].unit).toBe("人");
      expect(dataRows[2].unit).toBe("人");
      expect(dataRows[3].unit).toBe("人");
      expect(dataRows[4].unit).toBe("人");
      expect(dataRows[5].unit).toBe("人");
      expect(dataRows[6].unit).toBe("人");
    });

    it("データの件数が正しい", () => {
      const result =
        EstatDataTransformer.extractCategoriesFromMetadata(metadata);

      // 基本情報行 + cat01分類のデータ行
      const expectedCount = 1 + getCat01Count();

      expect(result).toHaveLength(expectedCount);

      const baseInfoRows = result.filter((r) => r.cat01 === null);
      expect(baseInfoRows).toHaveLength(1);

      const dataRows = result.filter((r) => r.cat01 !== null);
      expect(dataRows).toHaveLength(expectedCount - 1);
    });

    it("cat01分類のみが処理される（地域情報などは除外される）", () => {
      const result =
        EstatDataTransformer.extractCategoriesFromMetadata(metadata);
      const dataRows = result.filter((r) => r.cat01 !== null);

      // 地域コード（00000, 01000など）が含まれていないことを確認
      dataRows.forEach((row) => {
        if (row.cat01) {
          // cat01はAで始まるコードのみ（年齢・性別などの分類）
          expect(row.cat01).toMatch(/^A\d+$/);
        }
      });
    });
  });

  describe("後方互換性", () => {
    it("transformToCSVFormatが正しく動作する", () => {
      const result = EstatDataTransformer.transformToCSVFormat(metadata);
      expect(result).toHaveLength(1 + getCat01Count());
      expect(result[0].stats_data_id).toBe("0000010101");
    });

    it("transformMultipleToCSVFormatが正しく動作する", () => {
      const result = EstatDataTransformer.transformMultipleToCSVFormat([
        metadata,
      ]);
      expect(result).toHaveLength(1 + getCat01Count());
      expect(result[0].stats_data_id).toBe("0000010101");
    });
  });
});
