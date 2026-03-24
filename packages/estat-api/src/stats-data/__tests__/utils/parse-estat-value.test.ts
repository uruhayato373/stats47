import { describe, expect, it } from "vitest";
import { parseEstatValue } from "../../utils/parse-estat-value";

describe("e-Stat値のパース (parseEstatValue)", () => {
  it("数値文字列を正しくパースする", () => {
    expect(parseEstatValue("1234")).toBe(1234);
    expect(parseEstatValue("1234.5")).toBe(1234.5);
    expect(parseEstatValue("0")).toBe(0);
    expect(parseEstatValue("0.0")).toBe(0);
    expect(parseEstatValue("-100")).toBe(-100);
  });

  it("特殊文字をnullに変換する", () => {
    expect(parseEstatValue("***")).toBeNull();
    expect(parseEstatValue("-")).toBeNull();
    expect(parseEstatValue("X")).toBeNull();
    expect(parseEstatValue("…")).toBeNull();
  });

  it("空文字列をnullに変換する", () => {
    expect(parseEstatValue("")).toBeNull();
    expect(parseEstatValue("   ")).toBeNull();
    expect(parseEstatValue("\t")).toBeNull();
  });

  it("不正な値をnullに変換する", () => {
    expect(parseEstatValue("abc")).toBeNull();
    // 注: parseFloat('123abc')は123を返すため、これは有効な数値として扱われる
    expect(parseEstatValue("abc123")).toBeNull();
  });
});
