import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { LABOR_WAGES_CATALOG } from "../theme-catalog/labor-wages";

describe("labor-wages evidence topics", () => {
  it("労働需給と男女賃金格差を別の論点として扱う", () => {
    expect(
      LABOR_WAGES_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "labor-market-tightness", lensKey: "service-capacity" },
      { key: "gender-wage-equity", lensKey: "equity" },
    ]);
  });

  it("厚生労働省の一次資料と同一テーマ内の実在routeへ接続する", () => {
    const chartKeys = new Set(
      LABOR_WAGES_CATALOG.charts.map(({ componentKey }) => componentKey),
    );
    const rankingKeys = new Set(
      LABOR_WAGES_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of LABOR_WAGES_CATALOG.evidenceTopics ?? []) {
      expect(topic.relatedRankingKeys?.length).toBeGreaterThan(0);
      expect(topic.relatedChartKeys?.length).toBeGreaterThan(0);
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

  it("調査母集団と未調整比の違いを明記する", () => {
    const [laborMarket, genderGap] =
      LABOR_WAGES_CATALOG.evidenceTopics ?? [];

    expect(laborMarket?.summary).toContain("調査対象と時点が異なる");
    expect(genderGap?.summary).toContain("未調整の比率");
    expect(genderGap?.summary).toContain("短時間労働者を含まず");
  });
});
