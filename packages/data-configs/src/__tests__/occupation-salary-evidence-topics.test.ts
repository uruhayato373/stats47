import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { OCCUPATION_SALARY_CATALOG } from "../theme-catalog/occupation-salary";

describe("occupation-salary evidence topics", () => {
  it("registers the two verified wage-structure questions", () => {
    expect(OCCUPATION_SALARY_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({ key, lensKey }))).toEqual([
      { key: "medical-care-pay-structure", lensKey: "equity" },
      { key: "it-occupation-pay-comparison", lensKey: "composition" },
    ]);
  });

  it("links only catalog rankings, charts, and the official MHLW source", () => {
    const rankingKeys = new Set(OCCUPATION_SALARY_CATALOG.metrics.map(({ rankingKey }) => rankingKey));
    const chartKeys = new Set(OCCUPATION_SALARY_CATALOG.charts.map(({ componentKey }) => componentKey));

    for (const topic of OCCUPATION_SALARY_CATALOG.evidenceTopics ?? []) {
      for (const rankingKey of topic.relatedRankingKeys ?? []) expect(rankingKeys.has(rankingKey)).toBe(true);
      for (const chartKey of topic.relatedChartKeys ?? []) expect(chartKeys.has(chartKey)).toBe(true);
      expect(topic.sourceKeys).toEqual(["mhlw-wage-structure-survey"]);
    }

    const source = EVIDENCE_SOURCE_CATALOG["mhlw-wage-structure-survey"];
    expect(source.publisher).toBe("厚生労働省");
    expect(new URL(source.sourceUrl).hostname).toBe("www.mhlw.go.jp");
  });

  it("preserves the annualization, sample, and composition caveats", () => {
    const [medicalCare, itOccupations] = OCCUPATION_SALARY_CATALOG.evidenceTopics ?? [];
    expect(medicalCare?.summary).toContain("6月");
    expect(medicalCare?.summary).toContain("標本平均");
    expect(medicalCare?.summary).toContain("構成差は調整していない");
    expect(itOccupations?.summary).toContain("個人の実年収ではなく");
    expect(itOccupations?.summary).toContain("構成差も調整していない");
  });
});
