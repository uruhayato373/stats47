import { describe, expect, it } from "vitest";
import { PREFECTURE_LIST_2DIGIT, to2DigitPrefCode, to5DigitPrefCode } from "../prefecture-code";

describe("to2DigitPrefCode", () => {
  it("都道府県・市区町村の 5 桁コードと 2 桁コードから先頭 2 桁を返す", () => {
    expect(to2DigitPrefCode("13000")).toBe("13");
    expect(to2DigitPrefCode("13113")).toBe("13");
    expect(to2DigitPrefCode("13")).toBe("13");
    expect(to2DigitPrefCode("01000")).toBe("01");
  });
});

describe("to5DigitPrefCode", () => {
  it("2 桁・5 桁・市区町村コードを都道府県の 5 桁コードにそろえる", () => {
    expect(to5DigitPrefCode("13")).toBe("13000");
    expect(to5DigitPrefCode("13113")).toBe("13000");
    expect(to5DigitPrefCode("13000")).toBe("13000");
    expect(to5DigitPrefCode("01")).toBe("01000");
  });

  it("to2DigitPrefCode と往復しても値が変わらない", () => {
    for (const { code } of PREFECTURE_LIST_2DIGIT) {
      expect(to2DigitPrefCode(to5DigitPrefCode(code))).toBe(code);
    }
  });
});

describe("PREFECTURE_LIST_2DIGIT", () => {
  it("47 件の 2 桁コードと正式名を持つ", () => {
    expect(PREFECTURE_LIST_2DIGIT).toHaveLength(47);
    expect(PREFECTURE_LIST_2DIGIT[0]).toEqual({ code: "01", name: "北海道" });
    expect(PREFECTURE_LIST_2DIGIT[46]).toEqual({ code: "47", name: "沖縄県" });
  });
});

describe("先頭ゼロ落ち・数値のコード (remotion 等の局所実装を吸収)", () => {
  it("1 桁・数値・4 桁 (5 桁の先頭ゼロ落ち) を 2 桁へそろえる", () => {
    expect(to2DigitPrefCode("1")).toBe("01");
    expect(to2DigitPrefCode(1)).toBe("01");
    expect(to2DigitPrefCode(47)).toBe("47");
    expect(to2DigitPrefCode("1000")).toBe("01");
    expect(to2DigitPrefCode(1000)).toBe("01");
    expect(to2DigitPrefCode(13000)).toBe("13");
    expect(to2DigitPrefCode("00000")).toBe("00");
  });

  it("5 桁化も同じ規則に従う", () => {
    expect(to5DigitPrefCode("1")).toBe("01000");
    expect(to5DigitPrefCode(1000)).toBe("01000");
    expect(to5DigitPrefCode(" 13 ")).toBe("13000");
  });
});
