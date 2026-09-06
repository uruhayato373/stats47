import { describe, expect, it } from "vitest";

import {
  buildNoteProductDestination,
  isValidNoteKey,
} from "../note-referral";
import {
  STOREFRONT_PRODUCTS,
  findKindleProductForBlog,
  findStorefrontProduct,
} from "../storefront";

describe("product storefront", () => {
  it("公開URLが確定した商品だけを出す", () => {
    const kindle = STOREFRONT_PRODUCTS.filter((product) => product.channel === "kindle");
    const coconala = STOREFRONT_PRODUCTS.filter(
      (product) => product.channel === "coconala",
    );

    expect(kindle.length).toBeGreaterThan(0);
    expect(coconala.length).toBeGreaterThan(0);
    expect(kindle.every((product) => /^https:\/\/www\.amazon\.co\.jp\/dp\/[A-Z0-9]+$/.test(product.externalUrl))).toBe(true);
    expect(coconala.every((product) => /^https:\/\/coconala\.com\/services\/\d+$/.test(product.externalUrl))).toBe(true);
  });

  it("slug・外部URLが重複せず、価格が正数である", () => {
    const slugs = STOREFRONT_PRODUCTS.map((product) => product.slug);
    const urls = STOREFRONT_PRODUCTS.map((product) => product.externalUrl);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(urls).size).toBe(urls.length);
    expect(STOREFRONT_PRODUCTS.every((product) => product.priceYen > 0)).toBe(true);
  });

  it("ブログには実際に収録した販売中のKindle本だけを対応させる", () => {
    expect(findKindleProductForBlog("fiscal-health-50years-trend")).toMatchObject({
      id: "K-S1-06",
      channel: "kindle",
    });
    expect(findKindleProductForBlog("not-in-a-book")).toBeNull();
  });

  it("商品slugから詳細を引け、未知slugはnullになる", () => {
    expect(findStorefrontProduct("data-p-04")).toMatchObject({ id: "P-04" });
    expect(findStorefrontProduct("service-geo-service-01")).toMatchObject({
      id: "GEO-SERVICE-01",
      channelLabel: "個別分析サービス",
    });
    expect(findStorefrontProduct("unknown")).toBeNull();
  });

  it("note記事IDをGA4標準UTMへ決定的に変換する", () => {
    expect(isValidNoteKey("n68f5e09c8d62")).toBe(true);
    expect(isValidNoteKey("../invalid")).toBe(false);
    expect(
      buildNoteProductDestination("kindle-k-s1-02", "n68f5e09c8d62"),
    ).toBe(
      "/products/kindle-k-s1-02?utm_source=note&utm_medium=referral&utm_campaign=note_product&utm_content=n68f5e09c8d62",
    );
  });
});
