import { describe, it, expect } from "vitest";
import { createColorSchemes } from "../../../utils/color-scale/create-color-schemes";
import * as d3 from "d3";

const EXPECTED_SCHEMES = [
  "interpolateBlues",
  "interpolateGreens",
  "interpolateGreys",
  "interpolateOranges",
  "interpolatePurples",
  "interpolateReds",
  "interpolateViridis",
  "interpolatePlasma",
  "interpolateInferno",
  "interpolateMagma",
  "interpolateTurbo",
  "interpolateCool",
  "interpolateWarm",
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

describe("createColorSchemes", () => {
  it("should return an object containing all expected scheme keys", () => {
    const schemes = createColorSchemes(d3);
    for (const key of EXPECTED_SCHEMES) {
      expect(schemes).toHaveProperty(key);
    }
  });

  it("each scheme should be a function accepting a number and returning a string", () => {
    const schemes = createColorSchemes(d3);
    for (const key of EXPECTED_SCHEMES) {
      const interpolator = schemes[key];
      expect(typeof interpolator).toBe("function");
      const result = interpolator(0.5);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("scheme functions should return different colors for 0 and 1", () => {
    const schemes = createColorSchemes(d3);
    const interpolateBlues = schemes["interpolateBlues"];
    expect(interpolateBlues(0)).not.toBe(interpolateBlues(1));
  });
});
