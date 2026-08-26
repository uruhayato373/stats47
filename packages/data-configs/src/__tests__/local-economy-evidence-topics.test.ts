import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { LOCAL_ECONOMY_CATALOG } from "../theme-catalog/local-economy";

describe("local-economy evidence topics", () => {
  it("registers the two verified regional-economy questions", () => {
    expect(LOCAL_ECONOMY_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({ key, lensKey }))).toEqual([
      { key: "employment-industry-composition", lensKey: "composition" },
      { key: "business-base-density", lensKey: "service-capacity" },
    ]);
  });

  it("links only catalog rankings, charts, and official Statistics Bureau sources", () => {
    const rankingKeys = new Set(LOCAL_ECONOMY_CATALOG.metrics.map(({ rankingKey }) => rankingKey));
    const chartKeys = new Set(LOCAL_ECONOMY_CATALOG.charts.map(({ componentKey }) => componentKey));

    for (const topic of LOCAL_ECONOMY_CATALOG.evidenceTopics ?? []) {
      for (const rankingKey of topic.relatedRankingKeys ?? []) expect(rankingKeys.has(rankingKey)).toBe(true);
      for (const chartKey of topic.relatedChartKeys ?? []) expect(chartKeys.has(chartKey)).toBe(true);
      for (const sourceKey of topic.sourceKeys) {
        const source = EVIDENCE_SOURCE_CATALOG[sourceKey];
        expect(source.publisher).toBe("総務省統計局");
        expect(new URL(source.sourceUrl).hostname).toBe("www.stat.go.jp");
      }
    }
  });

  it("preserves denominator, coverage, and comparability caveats", () => {
    const [industry, establishments] = LOCAL_ECONOMY_CATALOG.evidenceTopics ?? [];
    expect(industry?.summary).toContain("産業分類不能");
    expect(industry?.summary).toContain("100％");
    expect(establishments?.summary).toContain("人口10万人当たり");
    expect(establishments?.summary).toContain("農林漁家");
    expect(establishments?.summary).toContain("2009年と2014年");
    expect(establishments?.summary).toContain("福島県");
  });
});
