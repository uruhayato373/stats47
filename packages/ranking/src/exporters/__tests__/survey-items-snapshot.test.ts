import { describe, expect, it } from "vitest";
import { buildRankingItemFromMetric } from "../../builders/build-ranking-item-from-metric";
import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import { surveyBucketsForItem } from "../survey-bucketing";
import { buildSurveyItemsSnapshot } from "../survey-items-snapshot";

describe("new theme source links in survey delivery", () => {
  it.each([
    ["vegetable-intake-male-age-adjusted", "national-health-nutrition-survey", "2024"],
    ["elementary5-fitness-score-male", "national-child-fitness-survey", "2025"],
    ["media-production-revenue", "economic-census-activity", "2020"],
    ["single-mother-households-income-under100", "employment-structure-survey", "2022"],
  ])("preserves the actual source and observation year of %s", (key, id, year) => {
    const item = buildRankingItemFromMetric(METRICS_REGISTRY[key]!, {
      now: "2026-09-10T10:00:00Z", registry: METRICS_REGISTRY,
      values: { yearCodes: [year] },
    });
    expect(surveyBucketsForItem(item)).toContain(id);
    const snapshot = buildSurveyItemsSnapshot(id, [item], "2026-09-10T10:00:00Z");
    expect(snapshot.count).toBe(1);
    expect(snapshot.items[0]).toMatchObject({ rankingKey: key, latestYear: { yearCode: year }, originalSurveys: [id] });
  });

  it("does not invent a survey for administrative NDB records", () => {
    const item = buildRankingItemFromMetric(METRICS_REGISTRY["health-checkup-late-dinner-rate"]!, { registry: METRICS_REGISTRY, now: "2026-09-10T10:00:00Z", values: { yearCodes: ["2023"] } });
    expect(surveyBucketsForItem(item)).toEqual([]);
  });
});
