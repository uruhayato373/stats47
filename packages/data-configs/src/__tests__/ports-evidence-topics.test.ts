import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { PORTS_CATALOG } from "../theme-catalog/ports";

describe("ports evidence topics", () => {
  it("貨物利用と旅客利用を別の論点として扱う", () => {
    expect(
      PORTS_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "cargo-throughput-concentration", lensKey: "participation" },
      { key: "passenger-port-use", lensKey: "participation" },
    ]);
  });

  it("国土交通省の一次資料と同一テーマ内の実在routeへ接続する", () => {
    const chartKeys = new Set(
      PORTS_CATALOG.charts.map(({ componentKey }) => componentKey),
    );
    const rankingKeys = new Set(
      PORTS_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of PORTS_CATALOG.evidenceTopics ?? []) {
      expect(topic.relatedRankingKeys?.length).toBeGreaterThan(0);
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

  it("統計から判定できない内容を注意書きで限定する", () => {
    const cargo = PORTS_CATALOG.evidenceTopics?.find(
      ({ key }) => key === "cargo-throughput-concentration",
    );
    const passenger = PORTS_CATALOG.evidenceTopics?.find(
      ({ key }) => key === "passenger-port-use",
    );

    expect(cargo?.summary).toContain("単位と対象が異なります");
    expect(passenger?.summary).toContain("利用者の実人数");
    expect(passenger?.summary).toContain("航路数は示しません");
  });
});
