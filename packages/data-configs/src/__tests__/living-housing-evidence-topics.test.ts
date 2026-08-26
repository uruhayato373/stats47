import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { LIVING_HOUSING_CATALOG } from "../theme-catalog/living-housing";

describe("living-housing evidence topics", () => {
  it("住宅ストックと居住空間を別の論点として扱う", () => {
    expect(
      LIVING_HOUSING_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "housing-stock-and-aging", lensKey: "sustainability" },
      { key: "tenure-space-gap", lensKey: "equity" },
    ]);
  });

  it("公式一次資料と同一テーマ内の実在routeへ接続する", () => {
    const chartKeys = new Set(
      LIVING_HOUSING_CATALOG.charts.map(({ componentKey }) => componentKey),
    );
    const rankingKeys = new Set(
      LIVING_HOUSING_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of LIVING_HOUSING_CATALOG.evidenceTopics ?? []) {
      expect(topic.relatedRankingKeys?.length).toBeGreaterThan(0);
      expect(topic.relatedChartKeys?.length).toBeGreaterThan(0);
      for (const rankingKey of topic.relatedRankingKeys ?? []) {
        expect(rankingKeys.has(rankingKey)).toBe(true);
      }
      for (const chartKey of topic.relatedChartKeys ?? []) {
        expect(chartKeys.has(chartKey)).toBe(true);
      }
      for (const sourceKey of topic.sourceKeys) {
        expect(EVIDENCE_SOURCE_CATALOG[sourceKey].sourceUrl).toMatch(
          /^https:\/\/(www8\.cao\.go\.jp|www\.stat\.go\.jp)\//,
        );
      }
    }
  });

  it("母集団と指標の限界を注意書きで固定する", () => {
    const stock = LIVING_HOUSING_CATALOG.evidenceTopics?.find(
      ({ key }) => key === "housing-stock-and-aging",
    );
    const space = LIVING_HOUSING_CATALOG.evidenceTopics?.find(
      ({ key }) => key === "tenure-space-gap",
    );

    expect(stock?.summary).toContain("65歳以上");
    expect(stock?.summary).toContain("全世帯");
    expect(stock?.summary).toContain("対象を同一視しません");
    expect(space?.summary).toContain("住宅価格や家賃");
    expect(space?.summary).toContain("世帯人員");
  });
});
