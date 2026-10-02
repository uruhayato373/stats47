import { STOREFRONT_PRODUCTS } from "./storefront.generated";

import type { StorefrontProduct } from "./types";

export { STOREFRONT_PRODUCTS };

/** 今回検証した財政記事と、販売中の既存データ集だけを対応させる。 */
export function findDataProductForBlog(
  blogSlug: string
): StorefrontProduct | null {
  if (blogSlug !== "local-government-debt-burden") return null;
  return findStorefrontProduct("data-p-04");
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
