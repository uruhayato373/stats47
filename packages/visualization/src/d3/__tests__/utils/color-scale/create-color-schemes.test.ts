import { describe, it, expect } from "vitest";
import { resolveColorInterpolator } from "../../../utils/color-scale/create-color-schemes";
import * as d3 from "d3";

// D3ColorScheme 型に定義されている全 interpolate* スキーム
const ALL_INTERPOLATE_SCHEMES = [
  // Sequential - 単色系
  "interpolateBlues",
  "interpolateGreens",
  "interpolateGreys",
  "interpolateOranges",
  "interpolatePurples",
  "interpolateReds",
  // Sequential - マルチカラー系
  "interpolateBuGn",
  "interpolateBuPu",
  "interpolateGnBu",
  "interpolateOrRd",
  "interpolatePuBuGn",
  "interpolatePuBu",
  "interpolatePuRd",
  "interpolateRdPu",
  "interpolateYlGnBu",
  "interpolateYlGn",
  "interpolateYlOrBr",
  "interpolateYlOrRd",
  // Sequential - 知覚的に均一
  "interpolateViridis",
  "interpolatePlasma",
  "interpolateInferno",
  "interpolateMagma",
  "interpolateCividis",
  "interpolateWarm",
  "interpolateCool",
  "interpolateTurbo",
  "interpolateCubehelix",
  // Diverging
  "interpolateBrBG",
  "interpolatePRGn",
  "interpolatePiYG",
  "interpolatePuOr",
  "interpolateRdBu",
  "interpolateRdGy",
  "interpolateRdYlBu",
  "interpolateRdYlGn",
  "interpolateSpectral",
];

describe("resolveColorInterpolator", () => {
  it.each(ALL_INTERPOLATE_SCHEMES)(
    "should resolve %s to a valid interpolation function",
    (scheme) => {
      const fn = resolveColorInterpolator(d3, scheme);
      expect(typeof fn).toBe("function");
      const result = fn(0.5);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    },
  );

  it("should return different colors for 0 and 1", () => {
    const fn = resolveColorInterpolator(d3, "interpolateBlues");
    expect(fn(0)).not.toBe(fn(1));
  });

  it("should fall back to interpolateBlues for unknown scheme", () => {
    const fn = resolveColorInterpolator(d3, "interpolateNonExistent");
    const expected = resolveColorInterpolator(d3, "interpolateBlues");
    expect(fn(0.5)).toBe(expected(0.5));
  });

  it("should use custom fallback when specified", () => {
    const fn = resolveColorInterpolator(d3, "interpolateNonExistent", "interpolateReds");
    const expected = resolveColorInterpolator(d3, "interpolateReds");
    expect(fn(0.5)).toBe(expected(0.5));
  });
});
