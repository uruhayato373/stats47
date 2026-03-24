import { describe, expect, it } from "vitest";
import { extractCategories } from "../../utils/extract-categories";
import { mockMetaInfoResponse } from "../fixtures/mock-responses";

describe("extractCategories", () => {
  it("正常なレスポンスからカテゴリ情報を抽出できること", () => {
    const categories = extractCategories(mockMetaInfoResponse);

    expect(categories).toHaveLength(1);
    
    // cat01
    const cat01 = categories.find(c => c.id === "cat01");
    expect(cat01).toBeDefined();
    expect(cat01?.name).toBe("項目");
    expect(cat01?.items).toHaveLength(2);
    expect(cat01?.items[0].code).toBe("A1101");
    expect(cat01?.items[0].name).toBe("総人口");

    // area, time are excluded
  });

  it("CLASS_OBJが空配列の場合、空配列を返すこと", () => {
    const emptyResponse = JSON.parse(JSON.stringify(mockMetaInfoResponse));
    emptyResponse.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ = [];
    
    const categories = extractCategories(emptyResponse);
    expect(categories).toEqual([]);
  });

  it("CLASSが単一オブジェクトの場合も正しく処理できること", () => {
    // CLASSが配列ではなく単一オブジェクトの場合のモック
    const singleClassResponse = JSON.parse(JSON.stringify(mockMetaInfoResponse));
    singleClassResponse.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ[0].CLASS = {
      "@code": "A1101", 
      "@name": "総人口", 
      "@level": "1"
    };

    const categories = extractCategories(singleClassResponse);
    const cat01 = categories.find(c => c.id === "cat01");
    
    expect(cat01?.items).toHaveLength(1);
    expect(cat01?.items[0].code).toBe("A1101");
    expect(cat01?.items[0].name).toBe("総人口");
  });
});
