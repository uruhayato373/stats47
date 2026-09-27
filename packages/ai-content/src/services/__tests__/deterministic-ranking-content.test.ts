import { fetchPrefectures } from "@stats47/area";
import { describe, expect, it } from "vitest";

import { buildDeterministicRankingContent } from "../deterministic-ranking-content";

describe("buildDeterministicRankingContent", () => {
  it("実データの構造を保った47県分の解説を生成する", () => {
    const prefectures = fetchPrefectures();
    const allPrefectures = prefectures.map((prefecture, index) => ({
      rank: index + 1,
      areaName: prefecture.prefName,
      value: 10_000 - index * 100,
    }));
    const values = allPrefectures.map((row) => row.value);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;

    const content = buildDeterministicRankingContent({
      rankingName: "テスト指標",
      unit: "件",
      yearCode: "2025",
      yearName: "2025年",
      top10: allPrefectures.slice(0, 10),
      bottom10: allPrefectures.slice(-10),
      allPrefectures,
      average,
      min: Math.min(...values),
      max: Math.max(...values),
      totalCount: allPrefectures.length,
    });

    expect(content.faq.items).toHaveLength(5);
    expect(content.prefectureCommentary.items).toHaveLength(47);
    expect(content.prefectureCommentary.items[0]).toMatchObject({
      areaCode: "01000",
      areaName: "北海道",
      rank: 1,
      value: 10_000,
    });
    for (const item of content.prefectureCommentary.items) {
      const length = item.commentary.replace(/\s/g, "").length;
      expect(length).toBeGreaterThanOrEqual(60);
      expect(length).toBeLessThanOrEqual(120);
    }
    expect(content.regionalAnalysis).toContain("## 北海道・東北");
    expect(content.regionalAnalysis).toContain("## 九州・沖縄");
    expect(content.insights).toContain("## 値の広がり");
    expect(content.insights).toContain("## 上位層の集中");
  });

  it("倍率や基準値を含む単位を数値へ連結しない", () => {
    const prefectures = fetchPrefectures();
    const allPrefectures = prefectures.map((prefecture, index) => ({
      rank: index + 1,
      areaName: prefecture.prefName,
      value: 200 - index,
    }));
    const values = allPrefectures.map((row) => row.value);
    const content = buildDeterministicRankingContent({
      rankingName: "テスト指数",
      unit: "（全国=100）",
      yearCode: "2025",
      yearName: "2025年",
      top10: allPrefectures.slice(0, 10),
      bottom10: allPrefectures.slice(-10),
      allPrefectures,
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      totalCount: allPrefectures.length,
    });

    const prose = `${content.insights} ${content.regionalAnalysis} ${content.faq.items
      .map((item) => item.answer)
      .join(" ")}`;
    expect(prose).not.toContain("（全国=100）");
    expect(prose).not.toMatch(/\d(?:100|千|万ＭＪ|万通)/);
  });

  describe("比較基準の呼び名 (2026-09-27 オーナー判断: 単純平均を「全国平均」と呼ばない)", () => {
    const build = (averageLabel?: string) => {
      const allPrefectures = fetchPrefectures().map((prefecture, index) => ({
        rank: index + 1,
        areaName: prefecture.prefName,
        value: 100 - index,
      }));
      return buildDeterministicRankingContent({
        rankingName: "テスト率",
        unit: "%",
        yearCode: "2025",
        yearName: "2025年",
        top10: allPrefectures.slice(0, 10),
        bottom10: allPrefectures.slice(-10),
        allPrefectures,
        average: 70,
        ...(averageLabel ? { averageLabel } : {}),
        min: 54,
        max: 100,
        totalCount: allPrefectures.length,
      });
    };
    const text = (content: ReturnType<typeof build>) => JSON.stringify(content);

    it("公表の全国値が渡されたら「全国値」で書く", () => {
      const content = build("全国値");
      expect(content.faq.items.find((item) => item.type === "average")?.question).toBe(
        "テスト率の全国値はいくつですか？",
      );
      expect(text(content)).not.toContain("全国平均");
      expect(text(content)).not.toContain("単純平均");
    });

    it("全国値が無ければ「47都道府県の単純平均」で書き、全国平均とは書かない", () => {
      const content = build();
      expect(text(content)).toContain("47都道府県の単純平均");
      expect(text(content)).not.toContain("全国平均");
      expect(text(content)).not.toContain("全国値");
    });
  });
});
