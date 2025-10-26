import { describe, it, expect } from "vitest";

import { safeRender } from "../utils/helpers";

describe("safeRender", () => {
  describe("基本的な値のレンダリング", () => {
    it("文字列を正しくレンダリングする", () => {
      expect(safeRender("Hello")).toBe("Hello");
      expect(safeRender("")).toBe("");
    });

    it("数値を正しくレンダリングする", () => {
      expect(safeRender(123)).toBe("123");
      expect(safeRender(0)).toBe("0");
      expect(safeRender(-1)).toBe("-1");
    });

    it("nullとundefinedを空文字列としてレンダリングする", () => {
      expect(safeRender(null)).toBe("");
      expect(safeRender(undefined)).toBe("");
    });
  });

  describe("e-Stat APIオブジェクトのレンダリング", () => {
    it("$プロパティを優先してレンダリングする", () => {
      const obj = { $: "総務省", "@no": "001" };
      expect(safeRender(obj)).toBe("総務省");
    });

    it("@nameプロパティをレンダリングする", () => {
      const obj = { "@name": "人口", "@code": "001" };
      expect(safeRender(obj)).toBe("人口");
    });

    it("@noプロパティをレンダリングする", () => {
      const obj = { "@no": "001" };
      expect(safeRender(obj)).toBe("001");
    });

    it("@codeプロパティをレンダリングする", () => {
      const obj = { "@code": "001" };
      expect(safeRender(obj)).toBe("001");
    });

    it("優先順位に従ってレンダリングする", () => {
      const obj = { "@code": "001", "@name": "人口", $: "総務省" };
      expect(safeRender(obj)).toBe("総務省"); // $が最優先
    });

    it("文字列でないプロパティはスキップする", () => {
      const obj = { $: "123", "@name": "人口" };
      expect(safeRender(obj)).toBe("123"); // $が最優先
    });

    it("有効なプロパティがない場合はJSON.stringifyする", () => {
      const obj = { invalid: "value", number: 123 };
      expect(safeRender(obj)).toBe('{"invalid":"value","number":123}');
    });

    it("fallbackToJsonがfalseの場合はString()を使用する", () => {
      const obj = { invalid: "value" };
      expect(safeRender(obj, { fallbackToJson: false })).toBe(
        "[object Object]"
      );
    });
  });

  describe("カスタム優先順位", () => {
    it("カスタム優先順位でレンダリングする", () => {
      const obj = { $: "総務省", "@name": "人口" };
      const result = safeRender(obj, {
        propertyPriority: ["@name", "$"],
      });
      expect(result).toBe("人口"); // @nameが優先
    });

    it("存在しないプロパティはスキップして次を試す", () => {
      const obj = { "@code": "001" };
      const result = safeRender(obj, {
        propertyPriority: ["@name", "@code"],
      });
      expect(result).toBe("001"); // @nameは存在しないので@codeを使用
    });
  });

  describe("エッジケース", () => {
    it("空のオブジェクトをレンダリングする", () => {
      expect(safeRender({})).toBe("{}");
    });

    it("配列をレンダリングする", () => {
      expect(safeRender([1, 2, 3])).toBe("[1,2,3]");
    });

    it("真偽値をレンダリングする", () => {
      expect(safeRender(true)).toBe("true");
      expect(safeRender(false)).toBe("false");
    });

    it("関数をレンダリングする", () => {
      const fn = () => "test";
      expect(safeRender(fn)).toBe('() => "test"');
    });
  });

  describe("型安全性", () => {
    it("型定義に従って正しく動作する", () => {
      // EstatApiObject型のテスト
      const estatObj = {
        $: "総務省",
        "@name": "人口統計",
        "@no": "001",
        "@code": "POP",
      };
      expect(safeRender(estatObj)).toBe("総務省");

      // 基本的な型のテスト
      expect(safeRender("string")).toBe("string");
      expect(safeRender(42)).toBe("42");
      expect(safeRender(null)).toBe("");
      expect(safeRender(undefined)).toBe("");
    });
  });
});
