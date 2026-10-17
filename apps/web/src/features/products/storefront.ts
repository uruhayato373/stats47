import { STOREFRONT_PRODUCTS } from "./storefront.generated";

import type { StorefrontProduct } from "./types";

export { STOREFRONT_PRODUCTS };

/**
 * 職場からの閲覧が多い記事 (GA4 landing-context で PC・平日 9〜18 時が平均超) と、
 * その読者の仕事に合う販売中のデータ集の対応。useCase は CTA の導入文に使う。
 * 2026-10-17 のペルソナ整理 (自治体の財政・計画担当 / 企業の商品企画 / 計画策定の受託者) に基づく。
 */
const BLOG_DATA_PRODUCTS: Readonly<
  Record<string, { readonly productSlug: string; readonly useCase: string }>
> = {
  "local-government-debt-burden": {
    productSlug: "data-p-04",
    useCase: "議会答弁や類似団体との比較資料で、県別の財政指標をExcelで編集したい方へ。",
  },
  "local-tax-revenue-gap": {
    productSlug: "data-p-04",
    useCase: "議会答弁や類似団体との比較資料で、県別の財政指標をExcelで編集したい方へ。",
  },
  "aging-solo-living-crisis": {
    productSlug: "data-p-05",
    useCase: "介護保険事業支援計画などの現状分析で、高齢化・介護の県別比較をExcelで使いたい方へ。",
  },
  "health-life-expectancy-structure": {
    productSlug: "data-p-05",
    useCase: "健康増進計画や介護保険事業支援計画の現状分析で、県別の比較表を使いたい方へ。",
  },
  "rice-harvest-volume-prefecture-gap": {
    productSlug: "data-p-09",
    useCase: "農業振興計画や産地比較の資料で、県別の農業・産業データをExcelで使いたい方へ。",
  },
  "farmland-crisis-abandoned-land": {
    productSlug: "data-p-09",
    useCase: "農業振興計画や産地比較の資料で、県別の農業・産業データをExcelで使いたい方へ。",
  },
  "automotive-industry-transformation-map": {
    productSlug: "data-p-09",
    useCase: "産業振興の計画や企業の立地検討で、県別の産業データをExcelで使いたい方へ。",
  },
  "water-sewage-crisis": {
    productSlug: "data-p-10",
    useCase: "上下水道の広域化や防災の計画資料で、県別のインフラデータをExcelで使いたい方へ。",
  },
  "household-solo-vs-dualincome": {
    productSlug: "data-p-14",
    useCase: "商品企画やエリアマーケティングの提案書で、品目別の家計消費の地域差を使いたい方へ。",
  },
  "noodle-consumption-prefecture-character": {
    productSlug: "data-p-14",
    useCase: "商品企画やエリアマーケティングの提案書で、品目別の家計消費の地域差を使いたい方へ。",
  },
};

/** 記事の読者の仕事に合う販売中のデータ集を返す。対応表に無い記事は null。 */
export function findDataProductForBlog(
  blogSlug: string
): StorefrontProduct | null {
  const match = BLOG_DATA_PRODUCTS[blogSlug];
  return match ? findStorefrontProduct(match.productSlug) : null;
}

/** findDataProductForBlog が返すデータ集を、その記事の読者にどう使うかの導入文。 */
export function findDataProductUseCase(blogSlug: string): string | null {
  return BLOG_DATA_PRODUCTS[blogSlug]?.useCase ?? null;
}

export function findFiscalCompanionProduct(
  slug: string
): StorefrontProduct | null {
  if (slug === "kindle-k-s1-06") return findStorefrontProduct("data-p-04");
  if (slug === "data-p-04") return findStorefrontProduct("kindle-k-s1-06");
  return null;
}

export function findStorefrontProduct(slug: string): StorefrontProduct | null {
  return STOREFRONT_PRODUCTS.find((product) => product.slug === slug) ?? null;
}

/** 実際に書籍へ収録したブログだけに、文脈一致した1冊を返す。 */
export function findKindleProductForBlog(
  blogSlug: string
): StorefrontProduct | null {
  return (
    STOREFRONT_PRODUCTS.find(
      (product) =>
        product.channel === "kindle" &&
        product.sourceBlogSlugs.some((sourceSlug) => sourceSlug === blogSlug)
    ) ?? null
  );
}
