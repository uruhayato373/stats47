import { findStorefrontProduct } from "./storefront";

import type { StorefrontProduct } from "./types";

export function isPublishedAnalysisRevision(published: StorefrontProduct, revision: StorefrontProduct) {
  return Boolean(published.analysisVersion && revision.slug === `${published.slug}-${published.analysisVersion}`);
}

/** 開発中は販売版に同じ商品IDの改訂案を添える。販売版の内容を置換しない。 */
export async function resolveProductDetail(slug: string) {
  const published = findStorefrontProduct(slug);
  if (!published) return null;

  if (process.env.NODE_ENV === "development") {
    const { ANALYSIS_PREVIEWS } = await import("./analysis-previews.generated");
    const revision = ANALYSIS_PREVIEWS.find((product) => product.id === published.id && !isPublishedAnalysisRevision(published, product));
    if (revision) return { product: published, revision, preview: true };
  }

  return { product: published, preview: false };
}
