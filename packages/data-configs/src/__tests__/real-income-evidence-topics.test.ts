import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { REAL_INCOME_CATALOG } from "../theme-catalog/real-income";

describe("real-income evidence topics", () => {
  it("registers the two verified household-income questions", () => {
    expect(REAL_INCOME_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({ key, lensKey }))).toEqual([
      { key: "worker-household-income-flow", lensKey: "outcomes" },
      { key: "price-and-rent-adjusted-purchasing-power", lensKey: "equity" },
    ]);
  });

  it("links only catalog rankings, charts, and official Statistics Bureau sources", () => {
    const rankingKeys = new Set(REAL_INCOME_CATALOG.metrics.map(({ rankingKey }) => rankingKey));
    const chartKeys = new Set(REAL_INCOME_CATALOG.charts.map(({ componentKey }) => componentKey));

    for (const topic of REAL_INCOME_CATALOG.evidenceTopics ?? []) {
      for (const rankingKey of topic.relatedRankingKeys ?? []) expect(rankingKeys.has(rankingKey)).toBe(true);
      for (const chartKey of topic.relatedChartKeys ?? []) expect(chartKeys.has(chartKey)).toBe(true);
      for (const sourceKey of topic.sourceKeys) {
        const source = EVIDENCE_SOURCE_CATALOG[sourceKey];
        expect(source.publisher).toBe("総務省統計局");
        expect(new URL(source.sourceUrl).hostname).toBe("www.stat.go.jp");
      }
    }
  });

  it("preserves population, geography, denominator, and period caveats", () => {
    const [incomeFlow, purchasingPower] = REAL_INCOME_CATALOG.evidenceTopics ?? [];
    expect(incomeFlow?.summary).toContain("県全体ではなく県庁所在市");
    expect(incomeFlow?.summary).toContain("二人以上の勤労者世帯");
    expect(purchasingPower?.summary).toContain("参考値");
    expect(purchasingPower?.summary).toContain("時系列の物価上昇率ではなく");
    expect(purchasingPower?.summary).toContain("年間の平均支出を月額換算");
  });
});
