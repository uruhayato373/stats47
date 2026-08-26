import { describe, expect, it } from "vitest";

import { AGING_SOCIETY_CATALOG } from "../theme-catalog/aging-society";
import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";

describe("aging-society evidence topics", () => {
  it("地域の年齢構成と高齢世帯構成を別の論点として扱う", () => {
    expect(
      AGING_SOCIETY_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "regional-aging-composition", lensKey: "composition" },
      { key: "elderly-household-composition", lensKey: "composition" },
    ]);
  });

  it("内閣府の一次資料と同一テーマ内の実在routeへ接続する", () => {
    const chartKeys = new Set(
      AGING_SOCIETY_CATALOG.charts.map(({ componentKey }) => componentKey),
    );
    const rankingKeys = new Set(
      AGING_SOCIETY_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of AGING_SOCIETY_CATALOG.evidenceTopics ?? []) {
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
        expect(source.publisher).toBe("内閣府");
        expect("notebookId" in source && source.notebookId).toBe(
          "2bf7f0dd-3935-49be-8cef-2d428c59eaa9",
        );
        expect(source.sourceUrl).toMatch(
          /^https:\/\/www8\.cao\.go\.jp\/kourei\/whitepaper\//,
        );
      }
    }
  });

  it("高齢化率と世帯割合の分母の誤読を注意書きで防ぐ", () => {
    const [aging, households] =
      AGING_SOCIETY_CATALOG.evidenceTopics ?? [];

    expect(aging?.summary).toContain("65歳以上人口を総人口で割った割合");
    expect(aging?.summary).toContain("絶対数ではありません");
    expect(households?.summary).toContain("一般世帯数で割った割合");
    expect(households?.summary).toContain("100％になるとは限りません");
  });
});
