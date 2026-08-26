import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { MANUFACTURING_CATALOG } from "../theme-catalog/manufacturing";

describe("manufacturing evidence topics", () => {
  it("生産基盤と人員あたり出荷規模を別の論点として扱う", () => {
    expect(
      MANUFACTURING_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "production-base-capacity", lensKey: "service-capacity" },
      { key: "shipment-per-worker", lensKey: "outcomes" },
    ]);
  });

  it("ものづくり白書と同一テーマ内の実在routeへ接続する", () => {
    const chartKeys = new Set(
      MANUFACTURING_CATALOG.charts.map(({ componentKey }) => componentKey),
    );
    const rankingKeys = new Set(
      MANUFACTURING_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of MANUFACTURING_CATALOG.evidenceTopics ?? []) {
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
        expect(source.publisher).toBe("経済産業省・厚生労働省・文部科学省");
        expect(source.sourceUrl).toBe(
          "https://www.meti.go.jp/report/whitepaper/mono/2026/index.html",
        );
      }
    }
  });

  it("出荷額指標を付加価値や利益と混同しない", () => {
    const topic = MANUFACTURING_CATALOG.evidenceTopics?.find(
      ({ key }) => key === "shipment-per-worker",
    );

    expect(topic?.summary).toContain("付加価値額や利益");
    expect(topic?.summary).toContain("定義が異なります");
  });
});
