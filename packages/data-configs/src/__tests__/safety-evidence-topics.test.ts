import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { SAFETY_CATALOG } from "../theme-catalog/safety";

describe("safety evidence topics", () => {
  it("犯罪と交通事故を別の論点として扱う", () => {
    expect(
      SAFETY_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "recognized-crime-and-clearance", lensKey: "outcomes" },
      { key: "traffic-accidents-and-injuries", lensKey: "outcomes" },
    ]);
  });

  it("警察庁の一次資料と同一テーマ内の実在routeへ接続する", () => {
    const chartKeys = new Set(
      SAFETY_CATALOG.charts.map(({ componentKey }) => componentKey),
    );
    const rankingKeys = new Set(
      SAFETY_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of SAFETY_CATALOG.evidenceTopics ?? []) {
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
        expect(source.publisher).toBe("警察庁");
        expect(source.sourceUrl).toMatch(
          /^https:\/\/www\.npa\.go\.jp\/publications\/statistics\//,
        );
      }
    }
  });

  it("認知犯罪と交通事故統計の誤読を注意書きで防ぐ", () => {
    const [crime, traffic] = SAFETY_CATALOG.evidenceTopics ?? [];

    expect(crime?.summary).toContain("未認知の事件は含みません");
    expect(crime?.summary).toContain("検挙人員の割合ではありません");
    expect(traffic?.summary).toContain("物損事故は含みません");
    expect(traffic?.summary).toContain("同じ単位として足し合わせません");
  });
});
