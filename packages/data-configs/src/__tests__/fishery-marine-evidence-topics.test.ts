import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { FISHERY_MARINE_CATALOG } from "../theme-catalog/fishery-marine";
import { METRICS_REGISTRY } from "../registry";

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
      // 家計調査由来の消費側の論点 (産地と消費地の不一致)。2026-09-05 追加
      { key: "fish-consumption-east-west", lensKey: "composition" },
    ]);
  });

  it("公式一次資料 (水産庁・総務省統計局) と実在する ranking / 同一テーマ内 chart へ接続する", () => {
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
        // 同一テーマの指標か、消費側 (家計調査) の active な ranking (theme-catalog-standards §4.6)
        expect(rankingKeys.has(rankingKey) || METRICS_REGISTRY[rankingKey]?.isActive === true).toBe(true);
      }
      for (const chartKey of topic.relatedChartKeys ?? []) {
        expect(chartKeys.has(chartKey)).toBe(true);
      }
      for (const sourceKey of topic.sourceKeys) {
        const source = EVIDENCE_SOURCE_CATALOG[sourceKey];
        expect(["水産庁", "総務省統計局"]).toContain(source.publisher);
        expect(["www.jfa.maff.go.jp", "www.stat.go.jp"]).toContain(new URL(source.sourceUrl).hostname);
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
