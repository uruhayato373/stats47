import { STOREFRONT_PRODUCTS } from "./storefront.generated";

import type { StorefrontProduct } from "./types";

export { STOREFRONT_PRODUCTS };

export function findStorefrontProduct(slug: string): StorefrontProduct | null {
  return STOREFRONT_PRODUCTS.find((product) => product.slug === slug) ?? null;
}

/** 実際に書籍へ収録したブログだけに、文脈一致した1冊を返す。 */
export function findKindleProductForBlog(
  blogSlug: string,
): StorefrontProduct | null {
  return (
    STOREFRONT_PRODUCTS.find(
      (product) =>
        product.channel === "kindle" &&
        product.sourceBlogSlugs.some((sourceSlug) => sourceSlug === blogSlug),
    ) ?? null
  );
}
