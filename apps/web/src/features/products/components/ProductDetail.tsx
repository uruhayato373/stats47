import { hrefFor } from "@stats47/data-configs/content/href";

import Link from "@/components/atoms/SiteLink";
import { Breadcrumbs, PageHeader, PageShell } from "@/components/layout";
import { SectionHeader } from "@/components/section";
import { SurfaceSection } from "@/components/surface";

import { getRequiredBaseUrl } from "@/lib/env";

import { productEditions } from "../editions";
import { findFiscalCompanionProduct } from "../storefront";

import { ProductOverview } from "./ProductOverview";
import { ProductPurchase } from "./ProductPurchase";
import { ProductShowcase } from "./ProductShowcase";
import { TrackedProductLink } from "./TrackedProductLink";

import type { StorefrontProduct } from "../types";

/** 販売版・改訂案の構成を共有し、販売先の案内には公開中の商品だけを使う。 */
export function ProductDetail({ product, revision, preview = false }: {
  readonly product: StorefrontProduct;
  readonly revision?: StorefrontProduct;
  readonly preview?: boolean;
}) {
  const editions = productEditions(product, revision);
  const fiscalCompanion = preview ? null : findFiscalCompanionProduct(product.slug);
  const displayTitle = product.displayTitle ?? product.title;
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
    url: `${baseUrl}${hrefFor("product", { slug: product.slug })}`,
  };

  return (
    <PageShell variant="reading">
      {!preview && <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />}
      <Breadcrumbs
        items={[
          { label: "ホーム", href: "/" },
          { label: "商品・書籍", href: "/products" },
          { label: displayTitle },
        ]}
      />
      <PageHeader
        title={displayTitle}
        description={product.description}
      />
      <SurfaceSection aria-label="商品詳細" className="@container gap-8" data-product-preview={preview || undefined}>
        {revision && <nav aria-label="商品の内容と改訂案" className="flex flex-col gap-2 text-sm">
          <p className="text-muted-foreground">販売中の内容と未公開の改訂候補を掲載しています。改訂案は現在販売中の商品には含まれていません。</p>
          {editions.map(edition => <Link key={edition.key} href={`#product-${edition.key}`} className="inline-flex min-h-11 items-center text-primary hover:underline">
            {edition.label}：{edition.product.displayTitle ?? edition.product.title}
          </Link>)}
        </nav>}
        {editions.map(edition => <section key={edition.key} id={`product-${edition.key}`} data-product-edition={edition.key} aria-label={edition.label} className="scroll-mt-24 flex flex-col gap-8">
          {revision && <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">{edition.label}：{edition.product.displayTitle ?? edition.product.title}</p>
            {edition.preview && <p className="text-sm text-muted-foreground">{edition.product.description}</p>}
          </div>}
          <ProductOverview product={edition.product} purchaseProduct={edition.preview ? undefined : product} preview={preview} />
          <ProductShowcase product={edition.product} />
          {edition.product.purchaseNotes?.length ? (
          <section aria-label={edition.preview ? "改訂案の範囲と注意点" : "購入前にご確認ください"} className="flex flex-col gap-3">
            <SectionHeader title={edition.preview ? "改訂案の範囲と注意点" : "購入前にご確認ください"} hideRule className="mb-0" />
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {edition.product.purchaseNotes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </section>
          ) : null}
        </section>)}

        {fiscalCompanion && (
          <section className="flex flex-col gap-4">
            <SectionHeader
              title="財政指標の読み方とデータ利用"
              hideRule
              className="mb-0"
            />
            <p className="text-sm leading-relaxed text-muted-foreground">
              地方債現在高の割合は年度末の残高を年間の歳出決算総額で割った値です。
              将来負担比率・実質公債費比率とは算定範囲が異なり、単一指標で健全性を判断できません。
            </p>
            <Link
              href="/blog/local-government-debt-burden"
              className="inline-block text-sm text-primary underline"
            >
              2022年度の地方債比較と指標の定義を無料で読む
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.slug === "data-p-04"
                ? "指標の読み方をまとめて学びたい方へ。"
                : "県別の値をExcelで編集したい方へ。固定年度・対応形式を購入前に確認してください。"}
            </p>
            <TrackedProductLink
              href={hrefFor("product", { slug: fiscalCompanion.slug })}
              label={`${fiscalCompanion.id}:${fiscalCompanion.title}`}
              surface="product_catalog"
              product={fiscalCompanion}
              placement="product_companion"
              className="inline-flex min-h-10 items-center text-sm text-primary underline"
            >
              {fiscalCompanion.title}の内容と価格を見る
            </TrackedProductLink>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <SectionHeader
            title="先に無料データを確認できます"
            hideRule
            className="mb-0"
          />
          <p className="text-sm leading-relaxed text-muted-foreground">
            stats47では都道府県ランキングと統計の出典を無料公開しています。購入前に、データの内容やサイトの品質をご確認ください。
          </p>
          <Link
            href="/ranking"
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            無料の都道府県ランキングを見る →
          </Link>
        </section>

        <ProductPurchase product={product} placement="product_detail_bottom" currentVersion={preview} />
      </SurfaceSection>
    </PageShell>
  );
}
