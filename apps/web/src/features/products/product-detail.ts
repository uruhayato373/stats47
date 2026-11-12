import { findStorefrontProduct } from "./storefront";

/** 通常のLPでも、開発中は同じ商品IDの改訂案を表示する。販売版の台帳は変更しない。 */
export async function resolveProductDetail(slug: string) {
  const published = findStorefrontProduct(slug);
  if (!published) return null;

  if (process.env.NODE_ENV === "development") {
    const { ANALYSIS_PREVIEWS } = await import("./analysis-previews.generated");
    const revision = ANALYSIS_PREVIEWS.find((product) => product.id === published.id);
    if (revision) return { product: revision, preview: true };
  }

  return { product: published, preview: false };
}
