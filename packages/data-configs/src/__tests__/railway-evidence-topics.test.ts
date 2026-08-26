import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { RAILWAY_CATALOG } from "../theme-catalog/railway";

describe("railway evidence topics", () => {
  it("旅客利用と貨物利用を別の論点として扱う", () => {
    expect(
      RAILWAY_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "passenger-demand-by-operator", lensKey: "participation" },
      { key: "freight-modal-shift", lensKey: "sustainability" },
    ]);
  });

  it("国土交通省の一次資料と同一テーマ内の実在routeへ接続する", () => {
    const chartKeys = new Set(
      RAILWAY_CATALOG.charts.map(({ componentKey }) => componentKey),
    );
    const rankingKeys = new Set(
      RAILWAY_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of RAILWAY_CATALOG.evidenceTopics ?? []) {
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
        expect(source.publisher).toBe("国土交通省");
        expect(source.sourceUrl).toMatch(/^https:\/\/www\.mlit\.go\.jp\//);
      }
    }
  });

  it("指標からは判定できない内容を注意書きで限定する", () => {
    const passenger = RAILWAY_CATALOG.evidenceTopics?.find(
      ({ key }) => key === "passenger-demand-by-operator",
    );
    const freight = RAILWAY_CATALOG.evidenceTopics?.find(
      ({ key }) => key === "freight-modal-shift",
    );

    expect(passenger?.summary).toContain("利用者の実人数ではありません");
    expect(freight?.summary).toContain("CO2削減量は示しません");
  });
});
