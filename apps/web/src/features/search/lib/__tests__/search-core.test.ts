import { describe, expect, it } from "vitest";

import { buildSearchResponse } from "../search-core";

/**
 * MiniSearch の rawResults 相当のモックデータ
 */
const rawResults = [
  {
    id: "ranking_1",
    title: "人口ランキング",
    description: "都道府県別の総人口",
    type: "ranking" as const,
    url: "/ranking/population",
    category: "人口・世帯",
    categoryKey: "population",
    tags: ["人口", "世帯"],
    publishedAt: "2024-06-15",
    score: 10,
  },
  {
    id: "blog_1",
    title: "経済分析ブログ",
    description: "経済データの分析",
    type: "blog" as const,
    url: "/blog/economy-analysis",
    category: "経済",
    categoryKey: "economy",
    tags: ["経済", "GDP"],
    publishedAt: "2024-01-20",
    score: 8,
  },
  {
    id: "blog_2",
    title: "人口動態レポート",
    description: "人口推移の分析",
    type: "blog" as const,
    url: "/blog/population-trend",
    category: "人口・世帯",
    categoryKey: "population",
    tags: ["人口"],
    publishedAt: "2023-12-01",
    score: 6,
  },
];

describe("buildSearchResponse", () => {
  it("フィルタなしの場合は全結果を返す", () => {
    const result = buildSearchResponse(rawResults, "人口");

    expect(result.results).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.query).toBe("人口");
  });

  it("type フィルタで結果を絞り込む", () => {
    const result = buildSearchResponse(rawResults, "人口", { type: "blog" });

    expect(result.results.every((r) => r.type === "blog")).toBe(true);
    expect(result.total).toBe(2);
  });

  it("category フィルタで categoryKey により絞り込む", () => {
    const result = buildSearchResponse(rawResults, "人口", {
      category: "economy",
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].id).toBe("blog_1");
  });

  it("tags フィルタでいずれかのタグに一致する結果を返す", () => {
    const result = buildSearchResponse(rawResults, "人口", {
      tags: ["GDP"],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].id).toBe("blog_1");
  });

  it("year フィルタで publishedAt の年を絞り込む", () => {
    const result = buildSearchResponse(rawResults, "人口", { year: "2023" });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].id).toBe("blog_2");
  });

  it("month フィルタで publishedAt の月を絞り込む", () => {
    const result = buildSearchResponse(rawResults, "人口", { month: "1" });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].id).toBe("blog_1");
  });

  it("limit と offset でページネーションできる", () => {
    const result = buildSearchResponse(rawResults, "人口", {
      limit: 1,
      offset: 1,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].id).toBe("blog_1");
    expect(result.total).toBe(3);
  });

  it("空の rawResults では空の results を返す", () => {
    const result = buildSearchResponse([], "テスト");

    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.query).toBe("テスト");
  });
});
