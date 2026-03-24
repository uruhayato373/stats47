import { formatValueWithPrecision } from "../format-value-with-precision";

describe("formatValueWithPrecision", () => {
  it("指定した精度でフォーマットされる", () => {
    expect(formatValueWithPrecision(1234.5, 2)).toBe("1,234.50");
  });
  it("precision=0 で整数表示", () => {
    expect(formatValueWithPrecision(1234.567, 0)).toBe("1,235");
  });
  it("NaN/Infinity をそのまま文字列化", () => {
    expect(formatValueWithPrecision(NaN, 2)).toBe("NaN");
    expect(formatValueWithPrecision(Infinity, 2)).toBe("Infinity");
  });
  it("負の precision は 0 扱い", () => {
    expect(formatValueWithPrecision(1234.567, -1)).toBe("1,235");
  });
});
