import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { FOREIGN_RESIDENTS_CATALOG } from "../theme-catalog/foreign-residents";

describe("foreign-residents evidence topics", () => {
  it("人口規模と国籍構成を別の論点として扱う", () => {
    expect(
      FOREIGN_RESIDENTS_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "foreign-population-scale-and-share", lensKey: "composition" },
      { key: "nationality-composition", lensKey: "composition" },
    ]);
  });

  it("国勢調査の一次資料と同一テーマ内の実在routeへ接続する", () => {
    const chartKeys = new Set(
      FOREIGN_RESIDENTS_CATALOG.charts.map(({ componentKey }) => componentKey),
    );
    const rankingKeys = new Set(
      FOREIGN_RESIDENTS_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of FOREIGN_RESIDENTS_CATALOG.evidenceTopics ?? []) {
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
        expect(source.publisher).toBe("総務省統計局");
        expect(source.sourceUrl).toBe(
          "https://www.stat.go.jp/data/kokusei/2020/kekka.html",
        );
      }
    }
  });

  it("国勢調査と在留外国人統計、国籍範囲の違いを明記する", () => {
    const [scale, nationality] =
      FOREIGN_RESIDENTS_CATALOG.evidenceTopics ?? [];

    expect(scale?.summary).toContain("在留外国人統計とは対象と時点が異なります");
    expect(nationality?.summary).toContain("すべての国籍や在留資格別");
  });
});
