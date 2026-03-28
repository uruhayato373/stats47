import MiniSearch from "minisearch";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MINISEARCH_OPTIONS, STORE_FIELDS } from "../search-core";
import { tokenize } from "../tokenize";

import type { SearchDocument } from "../../types/search.types";

const mockDocuments: SearchDocument[] = [
  {
    id: "ranking_1_prefecture",
    title: "人口ランキング",
    description: "都道府県別の総人口",
    type: "ranking",
    url: "/ranking/population",
    category: "人口・世帯",
    categoryKey: "population",
  },
  {
    id: "blog_economy-sample_2024",
    title: "経済のブログ記事",
    description: "経済指標について",
    type: "blog",
    url: "/blog/economy-sample/2024",
    category: "経済",
    categoryKey: "economy",
    publishedAt: "2024-01-01",
  },
];

function createMockIndexJson(): string {
  const ms = new MiniSearch<SearchDocument>({
    ...MINISEARCH_OPTIONS,
    storeFields: STORE_FIELDS,
    tokenize,
  });
  ms.addAll(mockDocuments);
  return JSON.stringify(ms.toJSON());
}

describe("searchDocuments", () => {
  const indexJson = createMockIndexJson();

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => JSON.parse(indexJson),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("空クエリの場合は results が空で total が 0 を返す", async () => {
    const { searchDocuments } = await import("../search-client");
    const res = await searchDocuments("");
    expect(res.results).toEqual([]);
    expect(res.total).toBe(0);
    expect(res.query).toBe("");
  });

  it("空白のみのクエリの場合は results が空で total が 0 を返す", async () => {
    const { searchDocuments } = await import("../search-client");
    const res = await searchDocuments("   ");
    expect(res.results).toEqual([]);
    expect(res.total).toBe(0);
  });

  it("ヒットするクエリで results と total が返る", async () => {
    const { searchDocuments } = await import("../search-client");
    const res = await searchDocuments("人口");
    expect(res.results.length).toBeGreaterThan(0);
    expect(res.total).toBe(res.results.length);
    expect(res.query).toBe("人口");
  });

  it("返却される各要素は SearchResult の形である", async () => {
    const { searchDocuments } = await import("../search-client");
    const res = await searchDocuments("人口");
    expect(res.results.length).toBeGreaterThan(0);
    for (const r of res.results) {
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("title");
      expect(r).toHaveProperty("description");
      expect(r).toHaveProperty("type");
      expect(r).toHaveProperty("url");
      expect(["ranking", "blog"]).toContain(r.type);
    }
  });

  it("options.type でフィルタできる", async () => {
    const { searchDocuments } = await import("../search-client");
    const res = await searchDocuments("人口", { type: "blog" });
    expect(res.results.every((r) => r.type === "blog")).toBe(true);
  });

  it("options.category で categoryKey によりフィルタできる", async () => {
    const { searchDocuments } = await import("../search-client");
    const res = await searchDocuments("人口", {
      category: "population",
    });
    expect(res.results.length).toBeGreaterThan(0);
    expect(
      res.results.every(
        (r) => r.type === "ranking"
      )
    ).toBe(true);
  });

  it("options.limit で件数が制限される", async () => {
    const { searchDocuments } = await import("../search-client");
    const res = await searchDocuments("人口", { limit: 1 });
    expect(res.results.length).toBe(1);
    expect(res.total).toBeGreaterThanOrEqual(1);
  });

  it("options.offset でスキップされる", async () => {
    const { searchDocuments } = await import("../search-client");
    const full = await searchDocuments("人口");
    const skipped = await searchDocuments("人口", { offset: 1 });
    if (full.results.length >= 2) {
      expect(skipped.results[0].id).not.toBe(full.results[0].id);
    }
    expect(skipped.total).toBe(full.total);
  });
});
