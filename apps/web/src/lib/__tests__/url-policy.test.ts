import { describe, expect, test } from "vitest";

import { MIN_INDEXABLE_TAG_ARTICLES, UrlPolicy } from "../url-policy";

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
