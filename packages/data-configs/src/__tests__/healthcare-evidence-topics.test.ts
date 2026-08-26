import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { HEALTHCARE_CATALOG } from "../theme-catalog/healthcare";

describe("healthcare evidence topics", () => {
  it("医療供給と病床利用を重複しない論点に分ける", () => {
    expect(
      HEALTHCARE_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "physician-distribution", lensKey: "service-capacity" },
      { key: "inpatient-capacity-and-use", lensKey: "participation" },
    ]);
  });

  it("採択論点を厚生労働省の一次資料と実在する内部導線へ接続する", () => {
    const chartKeys = new Set(
      HEALTHCARE_CATALOG.charts.map(({ componentKey }) => componentKey),
    );
    const rankingKeys = new Set(
      HEALTHCARE_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of HEALTHCARE_CATALOG.evidenceTopics ?? []) {
      expect(topic.relatedRankingKeys?.length).toBeGreaterThan(0);
      for (const rankingKey of topic.relatedRankingKeys ?? []) {
        expect(rankingKeys.has(rankingKey)).toBe(true);
      }
      for (const chartKey of topic.relatedChartKeys ?? []) {
        expect(chartKeys.has(chartKey)).toBe(true);
      }
      for (const sourceKey of topic.sourceKeys) {
        const source = EVIDENCE_SOURCE_CATALOG[sourceKey];
        expect(source.publisher).toBe("厚生労働省");
        expect(source.sourceUrl).toMatch(/^https:\/\/www\.mhlw\.go\.jp\//);
      }
    }
  });
});
