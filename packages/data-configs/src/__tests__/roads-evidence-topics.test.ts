import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { ROADS_CATALOG } from "../theme-catalog/roads";

describe("roads evidence topics", () => {
  it("道路網と維持管理を異なる論点として公式資料へ接続する", () => {
    expect(ROADS_CATALOG.evidenceTopics?.map(({ key }) => key)).toEqual([
      "trunk-road-network-access",
      "road-stock-maintenance",
    ]);

    for (const topic of ROADS_CATALOG.evidenceTopics ?? []) {
      expect(topic.relatedRankingKeys?.length).toBeGreaterThan(0);
      expect(topic.relatedChartKeys).toEqual(["roads-length-trend"]);
      for (const sourceKey of topic.sourceKeys) {
        const source = EVIDENCE_SOURCE_CATALOG[sourceKey];
        expect(source.publisher).toBe("国土交通省");
        expect(source.sourceUrl).toMatch(/^https:\/\/www\.mlit\.go\.jp\//);
      }
    }
  });

  it("老朽化を道路延長だけで判定しない注意書きを保持する", () => {
    const topic = ROADS_CATALOG.evidenceTopics?.find(
      ({ key }) => key === "road-stock-maintenance",
    );

    expect(topic?.summary).toContain("延長だけで老朽化の程度は判断しません");
  });
});
