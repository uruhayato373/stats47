import { describe, expect, it } from "vitest";

import { CONSUMER_PRICES_CATALOG } from "../theme-catalog/consumer-prices";
import { EVIDENCE_SOURCE_CATALOG } from "../theme-catalog/evidence-lenses";

describe("consumer-prices evidence topics", () => {
  it("総合指数と費目別価格構造を別の論点として扱う", () => {
    expect(
      CONSUMER_PRICES_CATALOG.evidenceTopics?.map(({ key, lensKey }) => ({
        key,
        lensKey,
      })),
    ).toEqual([
      { key: "overall-price-level-and-rent", lensKey: "composition" },
      { key: "essential-cost-profile", lensKey: "composition" },
    ]);
  });

  it("総務省統計局の一次資料と同一テーマ内の実在routeへ接続する", () => {
    const chartKeys = new Set(
      CONSUMER_PRICES_CATALOG.charts.map(
        ({ componentKey }) => componentKey,
      ),
    );
    const rankingKeys = new Set(
      CONSUMER_PRICES_CATALOG.metrics.map(({ rankingKey }) => rankingKey),
    );

    for (const topic of CONSUMER_PRICES_CATALOG.evidenceTopics ?? []) {
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
          "https://www.stat.go.jp/data/kouri/kouzou/gaiyou.html",
        );
      }
    }
  });

  it("地域差指数と家計負担の誤読を注意書きで防ぐ", () => {
    const [overall, essentials] =
      CONSUMER_PRICES_CATALOG.evidenceTopics ?? [];

    expect(overall?.summary).toContain("前年からの物価上昇率ではありません");
    expect(overall?.summary).toContain("持家の帰属家賃は含まれず");
    expect(essentials?.summary).toContain("実際に支払った金額や支出割合ではなく");
    expect(essentials?.summary).toContain("単純平均したりして総合指数");
  });
});
