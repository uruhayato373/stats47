import { describe, expect, it } from "vitest";
import { computeChartLayout, computeFontSize, computeMarginsByRatio } from "../layout";

describe("layout utilities", () => {
  describe("computeChartLayout", () => {
    it("should calculate correct inner dimensions", () => {
      const margins = { marginTop: 10, marginRight: 20, marginBottom: 30, marginLeft: 40 };
      const layout = computeChartLayout(800, 500, margins);
      
      expect(layout.innerWidth).toBe(800 - 40 - 20);
      expect(layout.innerHeight).toBe(500 - 10 - 30);
      expect(layout.width).toBe(800);
      expect(layout.height).toBe(500);
    });

    it("should handle zero dimensions gracefully", () => {
      const margins = { marginTop: 300, marginRight: 0, marginBottom: 300, marginLeft: 0 };
      const layout = computeChartLayout(800, 500, margins);
      
      expect(layout.innerHeight).toBe(0); // 500 - 600 -> 0
    });
  });

  describe("computeMarginsByRatio", () => {
    it("should calculate margins based on ratios", () => {
      const ratios = {
        top: 30 / 500,    // 0.06
        right: 30 / 800,  // 0.0375
        bottom: 30 / 500, // 0.06
        left: 100 / 800,  // 0.125
      };
      
      const margins = computeMarginsByRatio(1920, 1080, ratios);
      
      expect(margins.marginTop).toBe(Math.round(1080 * 0.06)); // 65
      expect(margins.marginRight).toBe(Math.round(1920 * 0.0375)); // 72
      expect(margins.marginBottom).toBe(Math.round(1080 * 0.06)); // 65
      expect(margins.marginLeft).toBe(Math.round(1920 * 0.125)); // 240
    });
  });

  describe("computeFontSize", () => {
    it("should calculate font size based on min dimension", () => {
      // ratio: 48 / 500 (D3BarChartRace date label ratio)
      const ratio = 48 / 500;
      
      // landscape: min(1920, 1080) = 1080
      expect(computeFontSize(1920, 1080, ratio)).toBe(Math.round(1080 * ratio)); // 104
      
      // portrait: min(1080, 1920) = 1080
      expect(computeFontSize(1080, 1920, ratio)).toBe(Math.round(1080 * ratio)); // 104
    });

    it("should respect minFontSize", () => {
      const ratio = 1 / 10000; // micro ratio
      expect(computeFontSize(100, 100, ratio, 12)).toBe(12);
    });
  });
});
