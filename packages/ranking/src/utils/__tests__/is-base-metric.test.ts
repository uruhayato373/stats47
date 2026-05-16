import { describe, expect, it } from "vitest";
import { isBaseMetric } from "../is-base-metric";

describe("isBaseMetric", () => {
  describe("ベースとして含める", () => {
    it("groupKey が key と一致する純粋なベース", () => {
      expect(isBaseMetric({ key: "total-shipments", unit: "百万円", groupKey: "total-shipments" })).toBe(true);
    });

    it("groupKey が無いベース", () => {
      expect(isBaseMetric({ key: "births", unit: "人", groupKey: null })).toBe(true);
    });

    it("calculation が isCalculated:false のみ", () => {
      expect(isBaseMetric({ key: "births", unit: "人", calculation: null })).toBe(true);
    });
  });

  describe("派生として除外", () => {
    it("分母メトリクス (total-population)", () => {
      expect(isBaseMetric({ key: "total-population", unit: "人" })).toBe(false);
    });

    it("分母メトリクス (households)", () => {
      expect(isBaseMetric({ key: "households", unit: "世帯" })).toBe(false);
    });

    it("分母メトリクス (total-area-including-northern-territories-and-takeshima)", () => {
      expect(isBaseMetric({ key: "total-area-including-northern-territories-and-takeshima", unit: "km²" })).toBe(false);
    });

    it("物理派生: groupKey !== key", () => {
      expect(
        isBaseMetric({
          key: "general-hospital-count-per-100k",
          unit: "施設/10万人",
          groupKey: "general-hospital-count",
        })
      ).toBe(false);
    });

    it("calculation.type === ratio", () => {
      expect(isBaseMetric({ key: "aging-rate", unit: "%", calculation: { type: "ratio" } })).toBe(false);
    });

    it("calculation.type === per_capita", () => {
      expect(isBaseMetric({ key: "income-per-capita", unit: "万円", calculation: { type: "per_capita" } })).toBe(false);
    });

    it("単位が %", () => {
      expect(isBaseMetric({ key: "employment-rate", unit: "%" })).toBe(false);
    });

    it("単位が ‰", () => {
      expect(isBaseMetric({ key: "birthrate", unit: "‰" })).toBe(false);
    });

    it("キーが -per-capita suffix", () => {
      expect(isBaseMetric({ key: "income-per-capita", unit: "万円" })).toBe(false);
    });

    it("キーが -per-100k suffix", () => {
      expect(isBaseMetric({ key: "crime-per-100k", unit: "件/10万人" })).toBe(false);
    });

    it("キーが -rate suffix", () => {
      expect(isBaseMetric({ key: "unemployment-rate", unit: "％" })).toBe(false);
    });

    it("キーが -ratio suffix", () => {
      expect(isBaseMetric({ key: "dependency-ratio", unit: "倍" })).toBe(false);
    });

    it("キーが -density suffix", () => {
      expect(isBaseMetric({ key: "population-density", unit: "人/km²" })).toBe(false);
    });

    it("キーが per- prefix", () => {
      expect(isBaseMetric({ key: "per-capita-income", unit: "万円" })).toBe(false);
    });
  });
});
