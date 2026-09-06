import { BookOpen, Database } from "lucide-react";

import { Breadcrumbs, PageHeader, PageShell } from "@/components/layout";
import { SectionHeader } from "@/components/section";
import { SurfaceSection } from "@/components/surface";

import { ProductItem, STOREFRONT_PRODUCTS } from "@/features/products";

import type { Metadata } from "next";

const kindleProducts = STOREFRONT_PRODUCTS.filter(
  (product) => product.channel === "kindle",
);
const dataProducts = STOREFRONT_PRODUCTS.filter(
  (product) => product.channel === "coconala",
);

export const metadata: Metadata = {
  title: "都道府県データの商品・Kindle本 | stats47",
  description:
    "stats47の公的統計を、読み物としてまとめたKindle本と、編集可能なPowerPoint・Excel・CSVデータ集です。無料の統計ページとの違いも確認できます。",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <PageShell>
      <Breadcrumbs
        items={[{ label: "ホーム", href: "/" }, { label: "商品・書籍" }]}
      />
      <PageHeader
        eyebrow="stats47の商品"
        title="読む本と、仕事で使える編集データ"
        description="サイトのランキングや統計値は引き続き無料です。商品では、テーマごとの編集・整理、図表、加工済みファイルによる時間短縮を提供します。"
        stats={`${kindleProducts.length}冊のKindle本 ・ ${dataProducts.length}点の編集可能データ`}
      />

      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <SurfaceSection className="p-5">
          <SectionHeader
            title={
              <span className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                読み物として楽しむ
              </span>
            }
            hideRule
            className="mb-0"
          />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            テーマに沿った複数の記事と図表を一冊に再構成したKindle電子書籍です。地域差の背景を順番に読みたい方に向いています。
          </p>
        </SurfaceSection>
        <SurfaceSection className="p-5">
          <SectionHeader
            title={
              <span className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" aria-hidden="true" />
                資料や分析に使う
              </span>
            }
            hideRule
            className="mb-0"
          />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            PowerPoint・Excel・CSVなど、編集可能な形式をまとめたデータ集です。企画書や比較資料をゼロから整える作業を短縮します。
          </p>
        </SurfaceSection>
      </div>

      <section>
        <SectionHeader
          title="Kindle電子書籍"
          description="Amazonで販売中と確認でき、ASINが確定している本だけを掲載しています。"
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kindleProducts.map((product) => (
            <ProductItem key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader
          title="編集可能な都道府県データ"
          description="ココナラで公開中のデータ集です。基準年、形式、利用条件を各商品ページで確認してから購入してください。"
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dataProducts.map((product) => (
            <ProductItem key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <SurfaceSection className="mt-12 p-5">
        <SectionHeader title="無料ページとの境界" hideRule className="mb-0" />
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          公開統計の結論や各都道府県の数値は、stats47のランキング・テーマページで無料公開しています。商品価格は、公的データそのものではなく、テーマ別の編集、検証、図表化、再利用しやすいファイル形式に対するものです。
        </p>
      </SurfaceSection>
    </PageShell>
  );
}
