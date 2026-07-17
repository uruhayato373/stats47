import assert from "node:assert/strict";
import test from "node:test";

import {
  blogUrlFor,
  buildInventory,
  hasBlog,
  hasRanking,
  hasTheme,
  loadPublishedBlogs,
  loadRankingKeysFromSource,
  rankingUrlFor,
  themeUrlFor,
} from "../buzz-map-inventory-core.mjs";

test("buildInventory: 配列 → Set 化・重複排除", () => {
  const inv = buildInventory({
    rankingKeys: ["a", "b", "a"],
    blogSlugs: ["slug-1", "slug-1", "slug-2"],
    blogTagsByslug: { "slug-1": ["家計調査", "旅行"], "slug-2": ["旅行", "宿泊"] },
    themeSlugs: ["tourism", "tourism", "safety"],
  });
  assert.equal(inv.rankingKeys.size, 2);
  assert.deepEqual([...inv.rankingKeys].sort(), ["a", "b"]);
  assert.equal(inv.blogSlugs.size, 2);
  assert.equal(inv.themeSlugs.size, 2);
  // tags は全 slug をまたいで重複排除
  assert.deepEqual([...inv.blogTags].sort(), ["宿泊", "家計調査", "旅行"].sort());
});

test("buildInventory: 空入力でも壊れない", () => {
  const inv = buildInventory();
  assert.equal(inv.rankingKeys.size, 0);
  assert.equal(inv.blogSlugs.size, 0);
  assert.equal(inv.blogTags.size, 0);
  assert.equal(inv.themeSlugs.size, 0);
});

test("hasRanking/hasBlog/hasTheme: 在庫あり → true / 無し → false", () => {
  const inv = buildInventory({
    rankingKeys: ["income-per-capita"],
    blogSlugs: ["accommodation-expenditure-ranking"],
    themeSlugs: ["tourism"],
  });
  assert.equal(hasRanking(inv, "income-per-capita"), true);
  assert.equal(hasRanking(inv, "not-a-key"), false);
  assert.equal(hasBlog(inv, "accommodation-expenditure-ranking"), true);
  assert.equal(hasBlog(inv, "no-such-slug"), false);
  assert.equal(hasTheme(inv, "tourism"), true);
  assert.equal(hasTheme(inv, "no-such-theme"), false);
});

test("rankingUrlFor/blogUrlFor/themeUrlFor: 正しいクリーンパス", () => {
  assert.equal(rankingUrlFor("income-per-capita"), "/ranking/income-per-capita");
  assert.equal(blogUrlFor("accommodation-expenditure-ranking"), "/blog/accommodation-expenditure-ranking");
  assert.equal(themeUrlFor("tourism"), "/themes/tourism");
});

test("loadRankingKeysFromSource: モック readFileImpl からキー抽出", () => {
  const fakeSource = `
export const KNOWN_RANKING_KEYS = [
  "annual-sunshine-duration",
  "income-per-capita",
  'taxable-income-per-capita',
] as const;
`;
  const readFileImpl = () => fakeSource;
  const keys = loadRankingKeysFromSource(readFileImpl);
  assert.deepEqual(keys, [
    "annual-sunshine-duration",
    "income-per-capita",
    "taxable-income-per-capita",
  ]);
});

test("loadRankingKeysFromSource: 読み込み失敗 → 空配列 (throw しない)", () => {
  const readFileImpl = () => {
    throw new Error("ENOENT");
  };
  const keys = loadRankingKeysFromSource(readFileImpl);
  assert.deepEqual(keys, []);
});

test("loadPublishedBlogs: モック fetchImpl から slugs / tagsBySlug 抽出", async () => {
  const payload = {
    generatedAt: "2026-07-12T22:02:26.584Z",
    articles: [
      {
        slug: "abortion-rate-prefecture-gap",
        tags: [{ tagKey: "中絶率" }, { tagKey: "厚労省" }],
      },
      {
        slug: "accommodation-expenditure-ranking",
        tags: [{ tagKey: "家計調査" }, { tagKey: "旅行" }],
      },
    ],
  };
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => payload });
  const { slugs, tagsBySlug } = await loadPublishedBlogs(fetchImpl);
  assert.deepEqual(slugs, ["abortion-rate-prefecture-gap", "accommodation-expenditure-ranking"]);
  assert.deepEqual(tagsBySlug["abortion-rate-prefecture-gap"], ["中絶率", "厚労省"]);
  assert.deepEqual(tagsBySlug["accommodation-expenditure-ranking"], ["家計調査", "旅行"]);
});

test("loadPublishedBlogs: HTTP エラー → 空 (throw しない)", async () => {
  const fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({}) });
  const { slugs, tagsBySlug } = await loadPublishedBlogs(fetchImpl);
  assert.deepEqual(slugs, []);
  assert.deepEqual(tagsBySlug, {});
});

test("loadPublishedBlogs: fetch 例外 → 空 (throw しない)", async () => {
  const fetchImpl = async () => {
    throw new Error("network");
  };
  const { slugs } = await loadPublishedBlogs(fetchImpl);
  assert.deepEqual(slugs, []);
});
