import { describe, expect, it } from "vitest";
import { getDecimalPlaces, getMaxDecimalPlaces } from "../get-max-decimal-places";
describe("getDecimalPlaces", () => {
    it("整数の場合は0を返す", () => {
        expect(getDecimalPlaces(123)).toBe(0);
        expect(getDecimalPlaces(0)).toBe(0);
        expect(getDecimalPlaces(-456)).toBe(0);
    });
    it("小数点以下の桁数を正しく返す", () => {
        expect(getDecimalPlaces(1.5)).toBe(1);
        expect(getDecimalPlaces(3.14)).toBe(2);
        expect(getDecimalPlaces(0.123)).toBe(3);
        expect(getDecimalPlaces(100.0001)).toBe(4);
    });
    it("負の小数も正しく処理する", () => {
        expect(getDecimalPlaces(-1.23)).toBe(2);
        expect(getDecimalPlaces(-0.001)).toBe(3);
    });
    it("Infinity や NaN の場合は0を返す", () => {
        expect(getDecimalPlaces(Infinity)).toBe(0);
        expect(getDecimalPlaces(-Infinity)).toBe(0);
        expect(getDecimalPlaces(NaN)).toBe(0);
    });
    it("指数表記の数値を正しく処理する", () => {
        expect(getDecimalPlaces(1e-3)).toBe(3); // 0.001
        expect(getDecimalPlaces(1.5e-2)).toBe(3); // 0.015
    });
});
describe("getMaxDecimalPlaces", () => {
    it("空配列の場合は0を返す", () => {
        expect(getMaxDecimalPlaces([])).toBe(0);
    });
    it("配列内の最大小数点桁数を返す", () => {
        expect(getMaxDecimalPlaces([1, 2, 3])).toBe(0);
        expect(getMaxDecimalPlaces([1.1, 2.22, 3.333])).toBe(3);
        expect(getMaxDecimalPlaces([100, 50.5, 25.25])).toBe(2);
    });
    it("負の数値も正しく処理する", () => {
        expect(getMaxDecimalPlaces([-1.1, -2.222, 3])).toBe(3);
    });
    it("単一要素の配列を正しく処理する", () => {
        expect(getMaxDecimalPlaces([3.14159])).toBe(5);
    });
});
