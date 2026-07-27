import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("@stats47/r2-storage/server", () => ({ saveToR2: vi.fn() }));
vi.mock("@stats47/visualization/server", () => ({
  generateRankingThumbnailMapSvg: vi.fn(),
}));
vi.mock("../../repositories/ranking-item", () => ({
  listRankingItemsWithTagsFromR2: vi.fn(),
}));
vi.mock("../../repositories/ranking-value", () => ({
  readRankingValuesFromR2: vi.fn(),
}));

import { checkRankingItemsCompleteness } from "../ranking-items-per-url-snapshot";

/**
 * 2026-07-27 障害 (item.json の部分列挙を全件と誤認し home/featured.json が
 * count:0 で上書きされた) の再発防止ガード。
 */
describe("checkRankingItemsCompleteness", () => {
  it("missingFeaturedKeys がある場合は理由付きで errors を返す", () => {
    const errors = checkRankingItemsCompleteness({
      itemCount: 2000,
      expectedMinCount: 1000,
      missingFeaturedKeys: ["some-key", "another-key"],
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("some-key");
    expect(errors[0]).toContain("another-key");
  });

  it("itemCount が expectedMinCount 未満の場合は理由付きで errors を返す", () => {
    const errors = checkRankingItemsCompleteness({
      itemCount: 28,
      expectedMinCount: 1979,
      missingFeaturedKeys: [],
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("items=28");
    expect(errors[0]).toContain("expected>=1979");
  });

  it("両方の異常が同時に起きた場合は 2 件の errors を返す", () => {
    const errors = checkRankingItemsCompleteness({
      itemCount: 28,
      expectedMinCount: 1979,
      missingFeaturedKeys: ["home-key"],
    });
    expect(errors).toHaveLength(2);
  });

  it("itemCount が expectedMinCount 以上かつ missingFeaturedKeys が空なら errors は空", () => {
    const errors = checkRankingItemsCompleteness({
      itemCount: 2199,
      expectedMinCount: 1979,
      missingFeaturedKeys: [],
    });
    expect(errors).toEqual([]);
  });

  it("itemCount が expectedMinCount とちょうど等しい境界値では errors は空 (未満のみ異常)", () => {
    const errors = checkRankingItemsCompleteness({
      itemCount: 1979,
      expectedMinCount: 1979,
      missingFeaturedKeys: [],
    });
    expect(errors).toEqual([]);
  });
});
