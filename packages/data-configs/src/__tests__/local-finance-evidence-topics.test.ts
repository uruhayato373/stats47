import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";
import { LOCAL_FINANCE_CATALOG } from "../theme-catalog/local-finance";

describe("local-finance evidence topics", () => {
  it("歳入基盤と債務負担を別の論点として扱う", () => {
    expect(
      LOCAL_FINANCE_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "revenue-base-and-equalization", lensKey: "composition" },
      { key: "debt-burden-and-soundness", lensKey: "sustainability" },
    ]);
  });

  it("総務省の一次資料と同一テーマ内の実在routeへ接続する", () => {
    const chartKeys = new Set(
      LOCAL_FINANCE_CATALOG.charts.map(({ componentKey }) => componentKey),
    );
    const rankingKeys = new Set(
      LOCAL_FINANCE_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of LOCAL_FINANCE_CATALOG.evidenceTopics ?? []) {
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
        expect(source.publisher).toBe("総務省");
        expect(source.sourceUrl).toMatch(/^https:\/\/www\.soumu\.go\.jp\//);
      }
    }
  });

  it("構成比の限界と資料年次の差を明記する", () => {
    const [revenueBase, debtBurden] =
      LOCAL_FINANCE_CATALOG.evidenceTopics ?? [];

    expect(revenueBase?.summary).toContain("歳入総額を分母とする構成比");
    expect(revenueBase?.summary).toContain("財政余力や税負担の大きさは判断できません");
    expect(debtBurden?.summary).toContain("対象期間と算定対象が異なる");
    expect(debtBurden?.summary).toContain("ランキングは2022年度、確報資料は2023年度決算");
  });
});
