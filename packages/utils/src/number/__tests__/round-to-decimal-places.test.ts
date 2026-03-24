import { describe, expect, it } from "vitest";

import { roundToDecimalPlaces } from "../round-to-decimal-places";

describe("roundToDecimalPlaces", () => {
  it("指定桁数で正しく丸める", () => {
    expect(roundToDecimalPlaces(3.14159, 2)).toBe(3.14);
    expect(roundToDecimalPlaces(3.14159, 3)).toBe(3.142);
    expect(roundToDecimalPlaces(3.14159, 0)).toBe(3);
  });

  it("四捨五入が正しく動作する", () => {
    expect(roundToDecimalPlaces(2.555, 2)).toBe(2.56);
    expect(roundToDecimalPlaces(2.554, 2)).toBe(2.55);
  });

  it("負の数値も正しく処理する", () => {
    expect(roundToDecimalPlaces(-3.14159, 2)).toBe(-3.14);
    // Math.round(-255.5) = -256 なので -2.56 になる
    expect(roundToDecimalPlaces(-2.555, 2)).toBe(-2.56);
  });

  it("整数は変更しない", () => {
    expect(roundToDecimalPlaces(100, 2)).toBe(100);
    expect(roundToDecimalPlaces(100, 0)).toBe(100);
  });

  it("桁数が負の場合は元の値を返す", () => {
    expect(roundToDecimalPlaces(3.14159, -1)).toBe(3.14159);
  });

  it("Infinity や NaN はそのまま返す", () => {
    expect(roundToDecimalPlaces(Infinity, 2)).toBe(Infinity);
    expect(roundToDecimalPlaces(-Infinity, 2)).toBe(-Infinity);
    expect(roundToDecimalPlaces(NaN, 2)).toBeNaN();
  });
});
