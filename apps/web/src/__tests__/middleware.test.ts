import { describe, expect, test } from "vitest";

import { isValidPrefCode } from "../middleware";

describe("isValidPrefCode", () => {
  test("01000 から 47000 までの有効な都道府県コードを true と判定する", () => {
    expect(isValidPrefCode("01000")).toBe(true);
    expect(isValidPrefCode("13000")).toBe(true);
    expect(isValidPrefCode("27000")).toBe(true);
    expect(isValidPrefCode("47000")).toBe(true);
  });

  test("prefNum が範囲外のコードを false と判定する", () => {
    expect(isValidPrefCode("00000")).toBe(false);
    expect(isValidPrefCode("48000")).toBe(false);
    expect(isValidPrefCode("99000")).toBe(false);
  });

  test("末尾が 000 でないコードを false と判定する（市区町村コードなど）", () => {
    expect(isValidPrefCode("14100")).toBe(false);
    expect(isValidPrefCode("13101")).toBe(false);
    expect(isValidPrefCode("01001")).toBe(false);
  });

  test("5 桁数字でないコードを false と判定する", () => {
    expect(isValidPrefCode("")).toBe(false);
    expect(isValidPrefCode("1000")).toBe(false);
    expect(isValidPrefCode("100000")).toBe(false);
    expect(isValidPrefCode("abcde")).toBe(false);
    expect(isValidPrefCode("01a00")).toBe(false);
  });
});
