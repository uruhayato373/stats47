import { describe, expect, it } from "vitest";

import { tokenize } from "../tokenize";

describe("tokenize", () => {
  it("空文字の場合は空配列を返す", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("空白のみの場合は空配列を返す", () => {
    expect(tokenize("   ")).toEqual([]);
  });

  it("null の場合は空配列を返す", () => {
    expect(tokenize(null as unknown as string)).toEqual([]);
  });

  it("undefined の場合は空配列を返す", () => {
    expect(tokenize(undefined as unknown as string)).toEqual([]);
  });

  it("文字列でない場合は空配列を返す", () => {
    expect(tokenize(123 as unknown as string)).toEqual([]);
  });

  it("日本語の単語を分割する", () => {
    const result = tokenize("人口統計のランキング");
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("人口");
    expect(result).toContain("統計");
    expect(result).toContain("ランキング");
  });

  it("英語のみの場合は単語として返す", () => {
    const result = tokenize("population ranking");
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((t) => t.includes("population"))).toBe(true);
  });

  it("数字のみの文字列でも配列を返す", () => {
    const result = tokenize("12345");
    expect(Array.isArray(result)).toBe(true);
  });
});
