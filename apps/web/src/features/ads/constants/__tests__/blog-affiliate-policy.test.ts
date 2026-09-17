import { describe, expect, it } from "vitest";

import { resolveContentVertical, resolveContentVerticalChain } from "../affiliate-category";
import { applyBlogAffiliatePolicy, BLOG_AFFILIATE_POLICY } from "../blog-affiliate-policy";

describe("BLOG_AFFILIATE_POLICY", () => {
  it("blocks unrelated furusato ads on the golf article despite kakei provenance", () => {
    const input = applyBlogAffiliatePolicy("golf-green-fee-consumption-ranking", {
      surveyIds: ["kakei-chousa"],
      tagKeys: ["家計調査", "ゴルフ", "スポーツ"],
    });
    expect(resolveContentVertical(input)).toEqual({
      source: "explicit-none",
      vertical: null,
      verticals: [],
    });
    expect(resolveContentVerticalChain(input)).toEqual({ blocked: true, steps: [] });
  });

  it("requires a non-empty reason for every authored exception", () => {
    for (const policy of Object.values(BLOG_AFFILIATE_POLICY)) {
      expect(policy.reason.trim().length).toBeGreaterThan(20);
    }
  });

  it("keeps unlisted articles on the automatic resolver", () => {
    const input = applyBlogAffiliatePolicy("another-article", {
      surveyIds: ["kakei-chousa"],
    });
    expect(resolveContentVertical(input).vertical).toBe("furusato");
  });
});

