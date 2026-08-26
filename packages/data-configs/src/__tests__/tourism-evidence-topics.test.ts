import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { TOURISM_CATALOG } from "../theme-catalog/tourism";

describe("tourism evidence topics", () => {
  it("総宿泊需要と外国人宿泊需要を分けて扱う", () => {
    expect(
      TOURISM_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "domestic-and-inbound-stays", lensKey: "participation" },
    ]);
  });

  it("観光庁の一次資料と同一テーマ内の実在routeへ接続する", () => {
    const topic = TOURISM_CATALOG.evidenceTopics?.[0];
    const chartKeys = new Set(
      TOURISM_CATALOG.charts.map(({ componentKey }) => componentKey),
    );
    const rankingKeys = new Set(
      TOURISM_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    expect(topic?.relatedRankingKeys?.length).toBeGreaterThan(0);
    expect(topic?.relatedChartKeys?.length).toBeGreaterThan(0);
    for (const rankingKey of topic?.relatedRankingKeys ?? []) {
      expect(rankingKeys.has(rankingKey)).toBe(true);
    }
    for (const chartKey of topic?.relatedChartKeys ?? []) {
      expect(chartKeys.has(chartKey)).toBe(true);
    }
    for (const sourceKey of topic?.sourceKeys ?? []) {
      const source = EVIDENCE_SOURCE_CATALOG[sourceKey];
      expect(source.publisher).toBe("観光庁");
      expect(source.sourceUrl).toMatch(
        /^https:\/\/www\.mlit\.go\.jp\/kankocho\//,
      );
    }
  });

  it("延べ泊数と内数の誤読を注意書きで防ぐ", () => {
    const topic = TOURISM_CATALOG.evidenceTopics?.[0];

    expect(topic?.summary).toContain("複数泊すると泊数分");
    expect(topic?.summary).toContain("総数の内数");
    expect(topic?.summary).toContain("両者を足さず");
  });
});
