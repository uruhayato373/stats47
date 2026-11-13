import { notFound } from "next/navigation";

import { ProductDetail, resolveProductDetail, STOREFRONT_PRODUCTS } from "@/features/products";
import { ANALYSIS_PREVIEWS } from "@/features/products/analysis-previews.generated";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "データ商品の改訂案", robots: { index: false, follow: false } };

/** プレビューは開発サーバー専用。サイトマップ・販売一覧には登録しない。 */
export default async function AnalysisPreviewPage({ params }: { readonly params: Promise<{ slug: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { slug } = await params;
  const revision = ANALYSIS_PREVIEWS.find(item => item.slug === slug);
  const published = STOREFRONT_PRODUCTS.find(item => item.id === revision?.id);
  if (!published) notFound();
  const detail = await resolveProductDetail(published.slug);
  if (!detail) notFound();

  return <ProductDetail {...detail} />;
}
