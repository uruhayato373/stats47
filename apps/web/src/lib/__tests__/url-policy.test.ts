import { CATEGORY_KEYS } from "@stats47/data-configs/categories";
import { describe, expect, test } from "vitest";


import {
  INDEXABLE_AREA_CATEGORIES,
  MIN_INDEXABLE_TAG_ARTICLES,
  NON_INDEXABLE_AREA_CATEGORIES,
  UrlPolicy,
} from "../url-policy";

describe("UrlPolicy.city", () => {
  test("通常市と政令指定都市の区を親県へ解決する", () => {
    expect(UrlPolicy.city.isKnownUnderPrefecture("13000", "13201")).toBe(true);
    expect(UrlPolicy.city.isKnownUnderPrefecture("04000", "04103")).toBe(true);
    expect(UrlPolicy.city.isKnownUnderPrefecture("05000", "04103")).toBe(false);
  });

  test("sitemap 整備済み市だけを indexable とする", () => {
    expect(UrlPolicy.city.isIndexable("01000", "01100")).toBe(true);
    expect(UrlPolicy.city.isIndexable("04000", "04103")).toBe(false);
  });
});

test("tag の indexable 閾値は sitemap/page 共通定数", () => {
  expect(MIN_INDEXABLE_TAG_ARTICLES).toBe(5);
});

test("公開 blog slug は sitemap fallback カタログと同じ allowlist を使う", () => {
  expect(UrlPolicy.blog.isKnownPublished("yogurt-spending-prefecture-gap")).toBe(true);
  expect(UrlPolicy.blog.isKnownPublished("not-a-published-article")).toBe(false);
});

describe("UrlPolicy.area の indexable カテゴリ ⇄ CATEGORY_KEYS", () => {
  test("indexable = 17 軸 − 理由付き除外 (手写しの一覧とずれない)", () => {
    const excluded = Object.keys(NON_INDEXABLE_AREA_CATEGORIES);
    expect([...INDEXABLE_AREA_CATEGORIES, ...excluded].sort()).toEqual([...CATEGORY_KEYS].sort());
    expect(new Set(INDEXABLE_AREA_CATEGORIES).size).toBe(INDEXABLE_AREA_CATEGORIES.length);
  });

  test("除外カテゴリはすべて CATEGORY_KEYS に実在し、空でない理由を持つ", () => {
    for (const [key, reason] of Object.entries(NON_INDEXABLE_AREA_CATEGORIES)) {
      expect(CATEGORY_KEYS as readonly string[]).toContain(key);
      expect(reason?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  test("isIndexableCategory は 17 軸外のキーを拒否する", () => {
    for (const key of INDEXABLE_AREA_CATEGORIES) expect(UrlPolicy.area.isIndexableCategory(key)).toBe(true);
    expect(UrlPolicy.area.isIndexableCategory("port")).toBe(false);
  });
});
