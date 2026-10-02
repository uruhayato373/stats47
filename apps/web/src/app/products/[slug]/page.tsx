import Link from "next/link";
import { notFound } from "next/navigation";

import { BookOpen, Check, Database, ExternalLink } from "lucide-react";

import { Breadcrumbs, PageHeader, PageShell } from "@/components/layout";
import { SectionHeader } from "@/components/section";
import { SurfaceSection } from "@/components/surface";

import {
  STOREFRONT_PRODUCTS,
  TrackedProductOutboundLink,
  TrackedProductLink,
  findFiscalCompanionProduct,
  findStorefrontProduct,
} from "@/features/products";

import { getRequiredBaseUrl } from "@/lib/env";
import { generateOGMetadata } from "@/lib/metadata/og-generator";
import { ogpImageKeys, ogpImageUrl } from "@/lib/metadata/ogp-image";

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
  const product = findStorefrontProduct(slug);
  if (!product) return { title: "商品が見つかりません" };

  const baseUrl = getRequiredBaseUrl();
  const canonicalPath = `/products/${product.slug}`;

  return {
    title: `${product.title} | stats47`,
    description: product.description,
    alternates: { canonical: canonicalPath },
    ...generateOGMetadata({
      title: `${product.title} | stats47`,
      description: product.description,
      imageUrl: ogpImageUrl(ogpImageKeys.product(product.slug)),
      url: `${baseUrl}${canonicalPath}`,
    }),
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = findStorefrontProduct(slug);
  if (!product) notFound();

  const Icon = product.channel === "kindle" ? BookOpen : Database;
  const destinationLabel = product.channel === "kindle" ? "Amazon" : "ココナラ";
  const fiscalCompanion = findFiscalCompanionProduct(slug);
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
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-foreground"
            >
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
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

      {fiscalCompanion && (
        <SurfaceSection className="mt-6 p-5">
          <SectionHeader
            title="財政指標の読み方とデータ利用"
            hideRule
            className="mb-0"
          />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            地方債現在高の割合は年度末の残高を年間の歳出決算総額で割った値です。
            将来負担比率・実質公債費比率とは算定範囲が異なり、単一指標で健全性を判断できません。
          </p>
          {slug === "data-p-04" && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              本商品は固定年度のデータ集で、自動更新はありません。Excel・CSV・PDFは110指標、PowerPointは先頭30指標です。
              Office実機での表示・編集互換性は未確認です。最新年度の資料や市町村比較に使う場合は、必要な年度と地域粒度を販売先で確認してください。
            </p>
          )}
          <Link
            href="/blog/local-government-debt-burden"
            className="mt-3 inline-block text-sm text-primary underline"
          >
            2022年度の地方債比較と指標の定義を無料で読む
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {slug === "data-p-04"
              ? "指標の読み方をまとめて学びたい方へ。"
              : "県別の値をExcelで編集したい方へ。固定年度・対応形式を購入前に確認してください。"}
          </p>
          <TrackedProductLink
            href={`/products/${fiscalCompanion.slug}`}
            label={`${fiscalCompanion.id}:${fiscalCompanion.title}`}
            surface="product_catalog"
            className="mt-2 inline-flex min-h-10 items-center text-sm text-primary underline"
          >
            {fiscalCompanion.title}の内容と価格を見る
          </TrackedProductLink>
        </SurfaceSection>
      )}

      <SurfaceSection className="mt-6 p-5">
        <SectionHeader
          title="先に無料データを確認できます"
          hideRule
          className="mb-0"
        />
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          stats47では都道府県ランキングと統計の出典を無料公開しています。購入前に、データの内容やサイトの品質をご確認ください。
        </p>
        <Link
          href="/ranking"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          無料の都道府県ランキングを見る →
        </Link>
      </SurfaceSection>
    </PageShell>
  );
}
