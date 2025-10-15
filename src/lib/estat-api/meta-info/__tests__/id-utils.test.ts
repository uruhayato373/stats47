import { describe, it, expect } from "vitest";
import { EstatIdUtils } from "../id-utils";

describe("EstatIdUtils", () => {
  describe("generateIdRange", () => {
    it("正常なID範囲を生成する", () => {
      const ids = EstatIdUtils.generateIdRange("0000010101", "0000010103");
      
      expect(ids).toEqual([
        "0000010101",
        "0000010102", 
        "0000010103"
      ]);
    });

    it("同じIDの場合は1要素の配列を返す", () => {
      const ids = EstatIdUtils.generateIdRange("0000010101", "0000010101");
      
      expect(ids).toEqual(["0000010101"]);
    });

    it("無効なIDでエラーを投げる", () => {
      expect(() => {
        EstatIdUtils.generateIdRange("invalid", "0000010103");
      }).toThrow("開始IDと終了IDは数値である必要があります");

      expect(() => {
        EstatIdUtils.generateIdRange("0000010101", "invalid");
      }).toThrow("開始IDと終了IDは数値である必要があります");
    });

    it("開始IDが終了IDより大きい場合はエラーを投げる", () => {
      expect(() => {
        EstatIdUtils.generateIdRange("0000010103", "0000010101");
      }).toThrow("開始IDは終了ID以下である必要があります");
    });
  });

  describe("formatId", () => {
    it("数値を正しい形式にフォーマットする", () => {
      expect(EstatIdUtils.formatId(10101)).toBe("0000010101");
      expect(EstatIdUtils.formatId(1)).toBe("0000000001");
      expect(EstatIdUtils.formatId(9999999999)).toBe("9999999999");
    });

    it("0を正しくフォーマットする", () => {
      expect(EstatIdUtils.formatId(0)).toBe("0000000000");
    });
  });

  describe("isValidId", () => {
    it("有効なIDを検証する", () => {
      expect(EstatIdUtils.isValidId("0000010101")).toBe(true);
      expect(EstatIdUtils.isValidId("0000000001")).toBe(true);
      expect(EstatIdUtils.isValidId("9999999999")).toBe(true);
    });

    it("無効なIDを検証する", () => {
      expect(EstatIdUtils.isValidId("")).toBe(false);
      expect(EstatIdUtils.isValidId("123")).toBe(false);
      expect(EstatIdUtils.isValidId("0000010101a")).toBe(false);
      expect(EstatIdUtils.isValidId("abc")).toBe(false);
      expect(EstatIdUtils.isValidId("00000101011")).toBe(false);
    });
  });

  describe("normalizeId", () => {
    it("有効なIDを正規化する", () => {
      expect(EstatIdUtils.normalizeId("0000010101")).toBe("0000010101");
      expect(EstatIdUtils.normalizeId("10101")).toBe("0000010101");
      expect(EstatIdUtils.normalizeId("1")).toBe("0000000001");
    });

    it("無効なIDでエラーを投げる", () => {
      expect(() => {
        EstatIdUtils.normalizeId("invalid");
      }).toThrow("無効なID: invalid");

      expect(() => {
        EstatIdUtils.normalizeId("");
      }).toThrow("無効なID: ");
    });
  });
});
