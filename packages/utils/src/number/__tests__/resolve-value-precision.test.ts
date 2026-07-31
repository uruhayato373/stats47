/**
 * 小数桁を**データセット単位で**解決する規約のテスト。
 *
 * 両方向を固定する:
 *   - 小数を持つ指標では、整数値も同じ桁数で表示される (`44` → `44.0`)
 *   - 整数だけの指標に余計な `.0` を付けない (過剰適用しない)
 */

import { describe, expect, it } from "vitest";

import { formatValueWithPrecision } from "../format-value-with-precision";
import { resolveValuePrecision } from "../resolve-value-precision";

describe("resolveValuePrecision", () => {
  it("★1 件でも小数があればその桁数を採る (44 も 44.0 にするため)", () => {
    expect(resolveValuePrecision([60.4, 54.9, 44, 24.4])).toBe(1);
  });

  it("★整数だけなら 0 (人口などに .0 を付けない)", () => {
    expect(resolveValuePrecision([110700, 98000, 44])).toBe(0);
  });

  it("小数第2位まであれば 2", () => {
    expect(resolveValuePrecision([1.25, 3.4, 7])).toBe(2);
  });

  it("★上限を超えたら丸める (桁が多すぎるとラベルが読めない)", () => {
    expect(resolveValuePrecision([1.23456789, 2])).toBe(2);
    expect(resolveValuePrecision([1.23456789, 2], 1)).toBe(1);
  });

  it("空・非有限値でも落ちない", () => {
    expect(resolveValuePrecision([])).toBe(0);
    expect(resolveValuePrecision([Number.NaN, Number.POSITIVE_INFINITY])).toBe(0);
    expect(resolveValuePrecision([Number.NaN, 3.5])).toBe(1);
  });
});

describe("formatValueWithPrecision と組で使う (規約の組)", () => {
  it("★同じデータセットの中で小数桁が混ざらない", () => {
    const values = [60.4, 54.9, 53.2, 44, 26.2, 24.8, 24.4];
    const p = resolveValuePrecision(values);
    const labels = values.map((v) => formatValueWithPrecision(v, p));
    const decimals = new Set(labels.map((l) => (l.split(".")[1] ?? "").length));
    expect(decimals.size).toBe(1);
    expect(labels).toContain("44.0");
  });

  it("★整数だけのデータセットには小数を付けない", () => {
    const values = [110700, 98000, 44];
    const p = resolveValuePrecision(values);
    expect(values.map((v) => formatValueWithPrecision(v, p))).toEqual([
      "110,700",
      "98,000",
      "44",
    ]);
  });
});
