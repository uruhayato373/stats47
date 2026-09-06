import Link from "next/link";
import { notFound } from "next/navigation";

import { BookOpen, Check, Database, ExternalLink } from "lucide-react";

import { Breadcrumbs, PageHeader, PageShell } from "@/components/layout";
import { SectionHeader } from "@/components/section";
import { SurfaceSection } from "@/components/surface";

import {
  STOREFRONT_PRODUCTS,
  TrackedProductOutboundLink,
  findStorefrontProduct,
} from "@/features/products";

import { getRequiredBaseUrl } from "@/lib/env";

import type { Metadata } from "next";

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return STOREFRONT_PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = findStorefrontProduct(slug);
  if (!product) return { title: "商品が見つかりません" };

  return {
    title: `${product.title} | stats47`,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = findStorefrontProduct(slug);
  if (!product) notFound();

  const Icon = product.channel === "kindle" ? BookOpen : Database;
  const destinationLabel = product.channel === "kindle" ? "Amazon" : "ココナラ";
  const baseUrl = getRequiredBaseUrl();
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.id,
    brand: { "@type": "Brand", name: "stats47" },
    offers: {
      "@type": "Offer",
      url: product.externalUrl,
      priceCurrency: "JPY",
      price: String(product.priceYen),
      availability: "https://schema.org/InStock",
    },
    url: `${baseUrl}/products/${product.slug}`,
  };

  return (
    <PageShell variant="reading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "ホーム", href: "/" },
          { label: "商品・書籍", href: "/products" },
          { label: product.title },
        ]}
      />
      <PageHeader
        eyebrow={product.channelLabel}
        title={product.title}
        description={product.description}
        stats={`${product.priceYen.toLocaleString("ja-JP")}円 ・ 販売先 ${destinationLabel}`}
      />

      <SurfaceSection className="p-6">
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              含まれるもの
            </span>
          }
          hideRule
          className="mb-0"
        />
        <ul className="mt-4 space-y-2">
          {product.included.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <SectionHeader title="こんな方へ" hideRule className="mb-0 mt-8" />
        <ul className="mt-3 flex flex-wrap gap-2">
          {product.audience.map((audience) => (
            <li
              key={audience}
              className="border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground"
            >
              {audience}
            </li>
          ))}
        </ul>

        <TrackedProductOutboundLink
          href={product.externalUrl}
          productId={product.id}
          productTitle={product.title}
          channel={product.channel}
          className="mt-8 inline-flex min-h-11 items-center gap-2 border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {destinationLabel}で内容を確認する
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </TrackedProductOutboundLink>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          購入・決済・返品等には販売先の規約が適用されます。基準年や対応形式は販売先の最新表示を確認してください。
        </p>
      </SurfaceSection>

      <SurfaceSection className="mt-6 p-5">
        <SectionHeader
          title="先に無料データを確認できます"
          hideRule
          className="mb-0"
        />
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          stats47では都道府県ランキングと統計の出典を無料公開しています。購入前に、データの内容やサイトの品質をご確認ください。
        </p>
        <Link href="/ranking" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
          無料の都道府県ランキングを見る →
        </Link>
      </SurfaceSection>
    </PageShell>
  );
}
