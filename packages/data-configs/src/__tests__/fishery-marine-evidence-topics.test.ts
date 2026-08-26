import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { FISHERY_MARINE_CATALOG } from "../theme-catalog/fishery-marine";

describe("fishery-marine evidence topics", () => {
  it("供給構造と担い手基盤を別の論点として扱う", () => {
    expect(
      FISHERY_MARINE_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "aquaculture-supply-shift", lensKey: "sustainability" },
      { key: "fishery-workforce-continuity", lensKey: "service-capacity" },
    ]);
  });

  it("水産庁の一次資料と同一テーマ内の実在routeへ接続する", () => {
    const chartKeys = new Set(
      FISHERY_MARINE_CATALOG.charts.map(({ componentKey }) => componentKey),
    );
    const rankingKeys = new Set(
      FISHERY_MARINE_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of FISHERY_MARINE_CATALOG.evidenceTopics ?? []) {
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
        expect(source.publisher).toBe("水産庁");
        expect(source.sourceUrl).toBe(
          "https://www.jfa.maff.go.jp/j/kikaku/wpaper/R7/260605_1.html",
        );
      }
    }
  });

  it("生産量・就業者数から判定できない内容を限定する", () => {
    const [supply, workforce] =
      FISHERY_MARINE_CATALOG.evidenceTopics ?? [];

    expect(supply?.summary).toContain("資源量の健全性や需要、採算性");
    expect(workforce?.summary).toContain("新規就業者数、年齢構成、兼業状況");
  });
});
