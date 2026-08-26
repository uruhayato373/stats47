import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { LABOR_MOBILITY_CATALOG } from "../theme-catalog/labor-mobility";

describe("labor-mobility evidence topics", () => {
  it("registers the two verified employment-status questions", () => {
    expect(LABOR_MOBILITY_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({ key, lensKey }))).toEqual([
      { key: "job-separation-and-change", lensKey: "mobility" },
      { key: "telework-participation", lensKey: "participation" },
    ]);
  });

  it("links only catalog rankings, charts, and the official Statistics Bureau source", () => {
    const rankingKeys = new Set(LABOR_MOBILITY_CATALOG.metrics.map(({ rankingKey }) => rankingKey));
    const chartKeys = new Set(LABOR_MOBILITY_CATALOG.charts.map(({ componentKey }) => componentKey));

    for (const topic of LABOR_MOBILITY_CATALOG.evidenceTopics ?? []) {
      for (const rankingKey of topic.relatedRankingKeys ?? []) expect(rankingKeys.has(rankingKey)).toBe(true);
      for (const chartKey of topic.relatedChartKeys ?? []) expect(chartKeys.has(chartKey)).toBe(true);
      expect(topic.sourceKeys).toEqual(["stat-employment-status-survey-2022"]);
    }

    const source = EVIDENCE_SOURCE_CATALOG["stat-employment-status-survey-2022"];
    expect(source.publisher).toBe("総務省統計局");
    expect(new URL(source.sourceUrl).hostname).toBe("www.stat.go.jp");
  });

  it("preserves denominator, period, and composition caveats", () => {
    const [jobMovement, telework] = LABOR_MOBILITY_CATALOG.evidenceTopics ?? [];
    expect(jobMovement?.summary).toContain("1年前");
    expect(jobMovement?.summary).toContain("15歳以上人口");
    expect(jobMovement?.summary).toContain("分母で互いに異なる");
    expect(telework?.summary).toContain("2022年の有業者");
    expect(telework?.summary).toContain("単年");
    expect(telework?.summary).toContain("産業・職業構成");
  });
});
