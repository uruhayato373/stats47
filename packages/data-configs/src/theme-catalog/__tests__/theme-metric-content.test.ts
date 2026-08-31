import { describe, expect, it } from "vitest";

import { METRICS_REGISTRY } from "../../registry";
import { THEME_CATALOGS } from "../index";
import {
  collectThemeMetricContentCoverage,
  validateThemeMetricContentCoverage,
} from "../theme-metric-content";

describe("theme metric content coverage", () => {
  it("テーマ参照指標だけの定義充足率を決定的に収集する", () => {
    const coverage = collectThemeMetricContentCoverage(
      Object.values(THEME_CATALOGS),
      METRICS_REGISTRY,
    );

    expect(coverage.themeReferencedKeys).toHaveLength(150);
    expect(coverage.missingDescriptionKeys).toHaveLength(0);
    expect(coverage.populatedNoteKeys).toHaveLength(76);
    expect(coverage.duplicateDescriptionGroups).toEqual([]);
  });

  it("欠落数の増加と正規化後に同一の説明文を拒否する", () => {
    const errors: string[] = [];
    const warns: string[] = [];
    validateThemeMetricContentCoverage(
      {
        themeReferencedKeys: ["metric-a", "metric-b", "metric-c"],
        missingDescriptionKeys: ["metric-c"],
        populatedNoteKeys: [],
        duplicateDescriptionGroups: [
          {
            normalizedDescription: "同じ 定義文です。",
            keys: ["metric-a", "metric-b"],
          },
        ],
      },
      { maxMissingDescriptions: 0, errors, warns },
    );

    expect(errors).toEqual([
      expect.stringContaining("[theme-metric-description-regression]"),
      expect.stringContaining("[theme-metric-description-duplicate]"),
    ]);
    expect(warns).toEqual([
      expect.stringContaining("themeReferenced=3 descriptionMissing=1 notePopulated=0"),
    ]);
  });
});
