import { describe, expect, it } from "vitest";

import { getMetricConfig } from "../../registry";
import { getJapanCatalogTheme } from "../japan-catalog";
import {
  JAPAN_DERIVED_METRIC_DECISIONS,
  getJapanDerivedMetricDecision,
} from "../japan-derived-metrics";
import { JAPAN_DERIVED_ADDITIVE_RECIPE_KEY } from "../types";

const EXPECTED_KEYS = [
  "fishing-port-count",
  "fishing-port-count-ksj",
  "laspeyres-index-prefecture",
  "railway-passengers",
  "railway-station-count",
  "real-disposable-income",
  "disposable-income-after-rent",
  "private-rent-consumption-expenditure",
  "roadside-station-count",
] as const;

const ADOPTED_KEYS = [
  "fishing-port-count-ksj",
  "railway-passengers",
  "railway-station-count",
  "roadside-station-count",
] as const;

describe("JAPAN_DERIVED_METRIC_DECISIONS", () => {
  it("unknown-non-estat 9件を重複なく全て判定する", () => {
    expect(JAPAN_DERIVED_METRIC_DECISIONS).toHaveLength(9);
    expect(
      [...JAPAN_DERIVED_METRIC_DECISIONS.map((decision) => decision.metricKey)].sort(),
    ).toEqual([...EXPECTED_KEYS].sort());
    expect(new Set(JAPAN_DERIVED_METRIC_DECISIONS.map((decision) => decision.metricKey)).size).toBe(9);
  });

  it("採用4件はderived-additive recipeと入力metricを持つ", () => {
    const adopted = JAPAN_DERIVED_METRIC_DECISIONS.filter(
      (decision) => decision.verdict === "adopted",
    );
    expect(adopted.map((decision) => decision.metricKey).sort()).toEqual(
      [...ADOPTED_KEYS].sort(),
    );
    for (const decision of adopted) {
      expect(decision.availability.status).toBe("derived-additive");
      expect(decision.availability.recipeKey).toBe(JAPAN_DERIVED_ADDITIVE_RECIPE_KEY);
      expect(decision.sourceMetricKey).toBe(decision.metricKey);
    }
  });

  it("不採用5件はunsupported理由と複数の根拠を持つ", () => {
    const rejected = JAPAN_DERIVED_METRIC_DECISIONS.filter(
      (decision) => decision.verdict === "rejected",
    );
    expect(rejected).toHaveLength(5);
    for (const decision of rejected) {
      expect(decision.availability.status).toBe("unsupported");
      expect(decision.availability.reason.length).toBeGreaterThan(0);
      expect(decision.evidence.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("全9件がregistryに実在し、採用分はJapan catalogへ載る", () => {
    for (const decision of JAPAN_DERIVED_METRIC_DECISIONS) {
      expect(getMetricConfig(decision.metricKey)).toBeDefined();
      if (decision.verdict === "rejected") continue;
      const theme = getJapanCatalogTheme(decision.themeKey);
      expect(theme?.metrics.some((metric) => metric.metricKey === decision.metricKey)).toBe(true);
    }
  });

  it("未審査keyを推測で採用しない", () => {
    expect(getJapanDerivedMetricDecision("not-reviewed")).toBeUndefined();
  });
});
