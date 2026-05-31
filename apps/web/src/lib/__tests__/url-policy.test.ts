import { describe, expect, it } from "vitest";

import {
  INDEXABLE_AREA_CATEGORIES,
  UrlPolicy,
  isValidPrefCode,
} from "../url-policy";

describe("INDEXABLE_AREA_CATEGORIES", () => {
  it("空でない", () => {
    expect(INDEXABLE_AREA_CATEGORIES.length).toBeGreaterThan(0);
  });
  it("population / economy を含む", () => {
    expect(INDEXABLE_AREA_CATEGORIES).toContain("population");
    expect(INDEXABLE_AREA_CATEGORIES).toContain("economy");
  });
});

describe("UrlPolicy.area.isIndexableCategory", () => {
  it("population / economy は indexable", () => {
    expect(UrlPolicy.area.isIndexableCategory("population")).toBe(true);
    expect(UrlPolicy.area.isIndexableCategory("economy")).toBe(true);
  });
  it("それ以外は非 indexable", () => {
    expect(UrlPolicy.area.isIndexableCategory("tourism")).toBe(false);
    expect(UrlPolicy.area.isIndexableCategory("unknown")).toBe(false);
  });
});

describe("UrlPolicy.cityCategory.isIndexableCategory", () => {
  it("県カテゴリと同じ allowlist (population/economy) のみ indexable", () => {
    expect(UrlPolicy.cityCategory.isIndexableCategory("population")).toBe(true);
    expect(UrlPolicy.cityCategory.isIndexableCategory("economy")).toBe(true);
  });
  it("それ以外は noindex (= 非 indexable)", () => {
    expect(UrlPolicy.cityCategory.isIndexableCategory("tourism")).toBe(false);
    expect(UrlPolicy.cityCategory.isIndexableCategory("agriculture")).toBe(false);
  });
  it("sitemap 出力集合とページ robots 判定が同一ソース", () => {
    for (const cat of UrlPolicy.cityCategory.indexableCategories) {
      expect(UrlPolicy.cityCategory.isIndexableCategory(cat)).toBe(true);
    }
  });
});

describe("isValidPrefCode", () => {
  it("01000〜47000 の末尾 000 のみ有効", () => {
    expect(isValidPrefCode("01000")).toBe(true);
    expect(isValidPrefCode("47000")).toBe(true);
  });
  it("範囲外 / 形式不正は無効", () => {
    expect(isValidPrefCode("48000")).toBe(false);
    expect(isValidPrefCode("00000")).toBe(false);
    expect(isValidPrefCode("13100")).toBe(false); // 政令市コード (末尾 != 000)
    expect(isValidPrefCode("1300")).toBe(false);
    expect(isValidPrefCode("abcde")).toBe(false);
  });
});
