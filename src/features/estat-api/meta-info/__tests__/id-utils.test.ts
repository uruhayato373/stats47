import { describe, it, expect } from "vitest";

import { EstatIdUtils } from "../id-utils";

describe("EstatIdUtils", () => {
  describe("generateIdRange", () => {
    it("正常なID範囲を生成する", () => {
      const ids = EstatIdUtils.generateIdRange("0000010101", "0000010103");

      expect(ids).toEqual(["0000010101", "0000010102", "0000010103"]);
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

    it("範囲外のIDを検証する", () => {
      expect(EstatIdUtils.isValidId("0000000000")).toBe(false); // 1未満
      expect(EstatIdUtils.isValidId("10000000000")).toBe(false); // 10桁を超える
    });
  });

  describe("validateIdFormat", () => {
    it("有効なIDを詳細検証する", () => {
      const result = EstatIdUtils.validateIdFormat("0000010101");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("無効なIDを詳細検証する", () => {
      // 空文字列
      let result = EstatIdUtils.validateIdFormat("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("IDは10桁である必要があります（現在: 0桁）");

      // 桁数不足
      result = EstatIdUtils.validateIdFormat("123");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("IDは10桁である必要があります（現在: 3桁）");

      // 桁数超過
      result = EstatIdUtils.validateIdFormat("12345678901");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("IDは10桁である必要があります（現在: 11桁）");

      // 非数字文字
      result = EstatIdUtils.validateIdFormat("000001010a");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("IDは数字のみで構成される必要があります");

      // 範囲外（1未満）
      result = EstatIdUtils.validateIdFormat("0000000000");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("IDは1以上である必要があります");

      // 範囲外（上限超過）
      result = EstatIdUtils.validateIdFormat("10000000000");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("IDは10桁である必要があります（現在: 11桁）");
    });

    it("境界値のIDを検証する", () => {
      // 最小値
      let result = EstatIdUtils.validateIdFormat("0000000001");
      expect(result.valid).toBe(true);

      // 最大値
      result = EstatIdUtils.validateIdFormat("9999999999");
      expect(result.valid).toBe(true);
    });
  });

  describe("normalizeId", () => {
    it("有効なIDを正規化する", () => {
      expect(EstatIdUtils.normalizeId("0000010101")).toBe("0000010101");
      expect(EstatIdUtils.normalizeId("0000010101")).toBe("0000010101");
      expect(EstatIdUtils.normalizeId("0000000001")).toBe("0000000001");
    });

    it("無効なIDでエラーを投げる", () => {
      expect(() => {
        EstatIdUtils.normalizeId("invalid");
      }).toThrow("IDは10桁である必要があります（現在: 7桁）");

      expect(() => {
        EstatIdUtils.normalizeId("");
      }).toThrow("IDは10桁である必要があります（現在: 0桁）");

      expect(() => {
        EstatIdUtils.normalizeId("10101");
      }).toThrow("IDは10桁である必要があります（現在: 5桁）");
    });
  });
});
