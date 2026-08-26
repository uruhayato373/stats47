import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { POPULATION_DYNAMICS_CATALOG } from "../theme-catalog/population-dynamics";

describe("population-dynamics evidence topics", () => {
  it("自然増減と年齢構成を別の論点として扱う", () => {
    expect(
      POPULATION_DYNAMICS_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "natural-population-change", lensKey: "outcomes" },
      { key: "age-structure-balance", lensKey: "composition" },
    ]);
  });

  it("人口推計・人口動態統計と同一テーマ内の実在routeへ接続する", () => {
    const chartKeys = new Set(
      POPULATION_DYNAMICS_CATALOG.charts.map(
        ({ componentKey }) => componentKey,
      ),
    );
    const rankingKeys = new Set(
      POPULATION_DYNAMICS_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of POPULATION_DYNAMICS_CATALOG.evidenceTopics ?? []) {
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
        expect(["総務省統計局", "厚生労働省"]).toContain(source.publisher);
        expect(source.sourceUrl).toMatch(
          /^https:\/\/(www\.stat\.go\.jp|www\.mhlw\.go\.jp)\//,
        );
      }
    }
  });

  it("率と実数、構成比と将来予測を区別する", () => {
    const [naturalChange, ageStructure] =
      POPULATION_DYNAMICS_CATALOG.evidenceTopics ?? [];

    expect(naturalChange?.summary).toContain("人口規模で標準化した率");
    expect(naturalChange?.summary).toContain("出生数・死亡数そのものとは区別");
    expect(ageStructure?.summary).toContain("人口規模の差を示さず");
    expect(ageStructure?.summary).toContain("将来人口の予測値でもありません");
  });
});
