import { describe, expect, it } from "vitest";

import { resolveContentVertical, resolveContentVerticalChain } from "../affiliate-category";
import {
  applyBlogAffiliatePolicy,
  BLOG_AFFILIATE_POLICY,
  isRegionalFoodCultureTitle,
  resolveBlogBannerInput,
} from "../blog-affiliate-policy";
import { resolveBlogRakutenPlacement } from "../blog-rakuten-placement";

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


// 出典が家計調査というだけで一律 furusato にすると、ビールやエアコンの記事にふるさと納税ポータルが出る
// (2026-09-24 実測: 出典調査だけで furusato の 222 本のうち地域の食卓・特産品は 42 本)。
describe("resolveBlogBannerInput", () => {
  const kakei = { surveyIds: ["kakei-chousa"], tagKeys: ["家計調査", "ビール"] };

  it("家計調査の品目記事は A8 バナーを出さず、楽天の商品カードは残す", () => {
    const title = "ビールが一番売れる月は7月ではない?";
    const bannerInput = resolveBlogBannerInput("beer-peak-month-july-to-december", kakei, { title });
    expect(resolveContentVertical(bannerInput).vertical).toBeNull();
    expect(resolveContentVerticalChain(bannerInput)).toEqual({ blocked: true, steps: [] });
    // 楽天カードは従来の解決 (furusato) で判定するので、品目の商品カードが出る
    const placement = resolveBlogRakutenPlacement({
      title,
      vertical: resolveContentVertical(applyBlogAffiliatePolicy("beer-peak-month-july-to-december", kakei)).vertical,
    });
    expect(placement?.kind).toBe("items");
  });

  it("地域の食卓・特産品の記事は furusato のまま", () => {
    const bannerInput = resolveBlogBannerInput("akita-table", kakei, { title: "秋田の食卓｜さんま・みそが日本一" });
    expect(resolveContentVertical(bannerInput)).toMatchObject({ source: "survey", vertical: "furusato" });
  });

  it("明示 policy と、出典調査以外で決まる furusato は変えない", () => {
    const golf = resolveBlogBannerInput("golf-green-fee-consumption-ranking", kakei, { title: "ゴルフ料金" });
    expect(resolveContentVertical(golf).source).toBe("explicit-none");
    const byTag = resolveBlogBannerInput("x", { surveyIds: [], tagKeys: ["ふるさと納税"] }, { title: "寄附額の県差" });
    expect(resolveContentVertical(byTag)).toEqual(resolveContentVertical({ surveyIds: [], tagKeys: ["ふるさと納税"] }));
  });

  it("地域判定は楽天の県別返礼品カードと同じ関数を使う", () => {
    expect(isRegionalFoodCultureTitle("秋田の食卓｜さんま・みそが日本一")).toBe(true);
    expect(isRegionalFoodCultureTitle("東北の食卓はなぜ塩辛い")).toBe(false); // 単一県でない
    expect(isRegionalFoodCultureTitle("秋田のエアコン購入")).toBe(false); // 食卓・特産品でない
    const placement = resolveBlogRakutenPlacement({ title: "秋田の食卓｜さんま・みそが日本一", vertical: "furusato" });
    expect(placement).toEqual({ kind: "furusato", areaCode: "05000" });
  });
});
