import { describe, expect, it } from "vitest";

import { generateMetadata as generateNoteReferralMetadata } from "../../../app/products/[slug]/from/note/[noteKey]/page";
import { buildNoteProductDestination, isValidNoteKey } from "../note-referral";
import {
  STOREFRONT_PRODUCTS,
  findKindleProductForBlog,
  findStorefrontProduct,
  findDataProductForBlog,
  findDataProductForRanking,
  findDataProductUseCase,
  findFiscalCompanionProduct,
} from "../storefront";

describe("product storefront", () => {
  it("財政記事だけに既存P-04を案内し、書籍とデータ集を混同しない", () => {
    expect(
      findDataProductForBlog("local-government-debt-burden")
    ).toMatchObject({
      id: "P-04",
      channel: "note",
      priceYen: 6000,
      externalUrl: "https://note.com/stats47/n/n5da8a99b3506",
    });
    expect(findDataProductForBlog("other")).toBeNull();
    expect(findDataProductUseCase("other")).toBeNull();
  });
  it("CSV を業務に使う人へ、ランキングの分野に合うデータ集を返す", () => {
    expect(findDataProductForRanking("financial-strength-index", "administrativefinancial")?.id).toBe("P-04");
    expect(findDataProductForRanking("rice-consumption-quantity", "agriculture")?.id).toBe("P-14");
    expect(findDataProductForRanking("miso-consumption-expenditure", null)?.id).toBe("P-14");
    expect(findDataProductForRanking("foreign-residents", "international")).toBeNull();
    expect(findDataProductForRanking("total-population", undefined)).toBeNull();
  });
  it("職場から読まれる記事に、読者の仕事に合う販売中のデータ集と用途文を対応させる", () => {
    const cases = [
      ["local-tax-revenue-gap", "P-04"],
      ["aging-solo-living-crisis", "P-05"],
      ["farmland-crisis-abandoned-land", "P-09"],
      ["water-sewage-crisis", "P-10"],
      ["household-solo-vs-dualincome", "P-14"],
    ] as const;
    for (const [slug, productId] of cases) {
      const product = findDataProductForBlog(slug);
      expect(product?.id).toBe(productId);
      expect(product?.channel).toBe("note");
      expect(findDataProductUseCase(slug)).toMatch(/方へ。$/);
    }
    expect(findFiscalCompanionProduct("kindle-k-s1-06")?.id).toBe("P-04");
    expect(findFiscalCompanionProduct("data-p-04")?.id).toBe("K-S1-06");
    expect(findFiscalCompanionProduct("data-p-10")).toBeNull();
  });
  it("公開URLが確定した商品だけを出す", () => {
    const kindle = STOREFRONT_PRODUCTS.filter(
      (product) => product.channel === "kindle"
    );
    const coconala = STOREFRONT_PRODUCTS.filter(
      (product) => product.channel === "note"
    );

    expect(kindle.length).toBeGreaterThan(0);
    expect(coconala.length).toBeGreaterThan(0);
    expect(
      kindle.every((product) =>
        /^https:\/\/www\.amazon\.co\.jp\/dp\/[A-Z0-9]+$/.test(
          product.externalUrl
        )
      )
    ).toBe(true);
    expect(
      coconala.every((product) =>
        /^https:\/\/note\.com\/stats47\/n\/n[a-f0-9]{12}$/.test(product.externalUrl)
      )
    ).toBe(true);
  });

  it("slug・外部URLが重複せず、価格が正数である", () => {
    const slugs = STOREFRONT_PRODUCTS.map((product) => product.slug);
    const urls = STOREFRONT_PRODUCTS.map((product) => product.externalUrl);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(urls).size).toBe(urls.length);
    expect(STOREFRONT_PRODUCTS.every((product) => product.priceYen > 0)).toBe(
      true
    );
  });

  it("ブログには実際に収録した販売中のKindle本だけを対応させる", () => {
    expect(
      findKindleProductForBlog("fiscal-health-50years-trend")
    ).toMatchObject({
      id: "K-S1-06",
      channel: "kindle",
    });
    expect(findKindleProductForBlog("not-in-a-book")).toBeNull();
  });

  it("商品slugから詳細を引け、撤退済みと未知の商品はnullになる", () => {
    expect(findStorefrontProduct("data-p-04")).toMatchObject({ id: "P-04" });
    expect(findStorefrontProduct("service-geo-service-01")).toBeNull();
    expect(findStorefrontProduct("unknown")).toBeNull();
  });

  it("note記事IDをGA4標準UTMへ決定的に変換する", () => {
    expect(isValidNoteKey("n68f5e09c8d62")).toBe(true);
    expect(isValidNoteKey("../invalid")).toBe(false);
    expect(buildNoteProductDestination("kindle-k-s1-02", "n68f5e09c8d62")).toBe(
      "/products/kindle-k-s1-02?utm_source=note&utm_medium=referral&utm_campaign=note_product&utm_content=n68f5e09c8d62"
    );
  });

  it("note向けclean URLを検索結果には載せず、転送先への巡回を許可する", async () => {
    const metadata = await generateNoteReferralMetadata({
      params: Promise.resolve({
        slug: "kindle-k-s1-06",
        noteKey: "n68f5e09c8d62",
      }),
    });
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: true,
    });
  });

  it("note向けclean URLは転送先を待たず、この URL 自身に商品のOGPを持つ (noteのカード解決用)", async () => {
    const metadata = await generateNoteReferralMetadata({
      params: Promise.resolve({
        slug: "kindle-k-s1-06",
        noteKey: "n68f5e09c8d62",
      }),
    });
    const product = findStorefrontProduct("kindle-k-s1-06");
    expect(product).not.toBeNull();
    expect(metadata.openGraph?.title).toBe(`${product?.title} | stats47`);
    expect(metadata.openGraph?.description).toBe(product?.description);
    expect(metadata.openGraph?.images).toBeTruthy();
  });

  it("未知slugではOGPを持たずrobotsだけを返す", async () => {
    const metadata = await generateNoteReferralMetadata({
      params: Promise.resolve({ slug: "unknown", noteKey: "n68f5e09c8d62" }),
    });
    expect(metadata).toEqual({ robots: { index: false, follow: true } });
  });
});
