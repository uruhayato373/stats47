import { describe, expect, it } from "vitest";
import { METRICS_REGISTRY } from "../../registry";
import { buildRecipe } from "../../recipe";
import { THEME_CATALOGS } from "../index";
import contract from "./fixtures/ssds-denominator-contract.json";

// Source formula facts, not unit strings or key suffixes, define the denominator.
// sourceRow and sourcePageSha256 preserve the official SSDS evidence read on verifiedAt.
describe("SSDS denominator labels", () => {
  it.each(contract.metrics)("$key retains its published unit and recipe without a second normalization", (fact) => {
    const config = METRICS_REGISTRY[fact.key];
    expect(config.source.kind).toBe("estat");
    expect(config.source).toMatchObject({ cdCat01: fact.code });
    expect(config.unit).toBe(fact.unit);
    expect(config.calculation?.normalizationOptions ?? []).toEqual([]);
    expect(buildRecipe(config).configHash).toBe(fact.recipeHash);
    if (fact.subtitle) expect(config.subtitle).toBe(fact.subtitle);
    if (fact.requiredLabel) {
      const entries = Object.values(THEME_CATALOGS).flatMap((catalog) => catalog.metrics)
        .filter((metric) => metric.rankingKey === fact.key);
      expect(entries.length).toBeGreaterThan(0);
      for (const metric of entries) expect(metric.shortLabel).toBe(fact.requiredLabel);
    }
  });

  it("does not infer rates from raw source key names or strip legitimate count normalization", () => {
    for (const [key, code] of [
      ["foreign-resident-count", "A1700"],
      ["foreign-resident-count-china", "A1702"],
      ["elementary-school-count", "E2101"],
      ["road-total-length-with-expressway", "H711001"],
    ]) {
      expect(METRICS_REGISTRY[key].source).toMatchObject({ cdCat01: code });
      expect(METRICS_REGISTRY[key].calculation?.normalizationOptions?.length).toBeGreaterThan(0);
    }
  });

  it("keeps absolute road length and area-normalized road length in separate comparison groups", () => {
    const catalog = THEME_CATALOGS.roads;
    const absolute = catalog.metricGroups?.find((group) => group.rankingKeys.includes("road-total-length-with-expressway"));
    const density = catalog.metricGroups?.find((group) => group.rankingKeys.includes("road-length-per-km2"));
    expect(absolute).toBeDefined();
    expect(density).toBeDefined();
    expect(absolute?.key).not.toBe(density?.key);
    expect(density?.title).toContain("総面積1km²");
  });

  it("states the Japanese population denominator and the limited five-cause composition", () => {
    const chart = THEME_CATALOGS.healthcare.charts.find((entry) => entry.componentKey === "theme-health-death-causes-donut");
    expect(chart?.annotation).toContain("日本人人口10万人");
    expect(chart?.annotation).toContain("5死因の合計を100%");
    for (const section of THEME_CATALOGS.healthcare.sections ?? []) {
      expect(section.description).not.toContain("系列は実数です");
    }
  });

  it("distinguishes university entrants from all high-school graduates", () => {
    const chart = THEME_CATALOGS["education-culture"].charts.find((entry) => entry.componentKey === "theme-edu-higher-education-trend");
    expect(chart?.annotation).toContain("大学入学者が分母");
    expect(chart?.annotation).toContain("高校卒業者全体の大学進学率ではありません");
  });

  it("identifies overnight totals as including foreign guests", () => {
    const chart = THEME_CATALOGS.tourism.charts.find((entry) => entry.componentKey === "theme-tourism-stay-trend");
    expect(chart?.title).toContain("総数・外国人");
    expect(chart?.annotation).toContain("総数には外国人を含みます");
  });
});
