import { notFound } from "next/navigation";

import { hrefFor } from "@stats47/data-configs/content/href";

import { ProductDetail, resolveProductDetail, STOREFRONT_PRODUCTS } from "@/features/products";

import { getRequiredBaseUrl } from "@/lib/env";
import { generateOGMetadata } from "@/lib/metadata/og-generator";
import { ogpImageKeys, ogpImageUrl } from "@/lib/metadata/ogp-image";
import { formatOgpTitle } from "@/lib/metadata/site-title";

import type { Metadata } from "next";

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return STOREFRONT_PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await resolveProductDetail(slug);
  if (!detail) return { title: "商品が見つかりません" };
  const { product, preview } = detail;
  if (preview) return { title: product.title, description: product.description, robots: { index: false, follow: false } };

  const baseUrl = getRequiredBaseUrl();
  const canonicalPath = hrefFor("product", { slug: product.slug });

  return {
    title: product.title,
    description: product.description,
    alternates: { canonical: canonicalPath },
    ...generateOGMetadata({
      title: formatOgpTitle(product.title),
      description: product.description,
      imageUrl: ogpImageUrl(ogpImageKeys.product(product.slug)),
      url: `${baseUrl}${canonicalPath}`,
    }),
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const detail = await resolveProductDetail(slug);
  if (!detail) notFound();
  return <ProductDetail {...detail} />;
}
