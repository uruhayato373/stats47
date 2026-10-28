import { notFound } from "next/navigation";

import { hrefFor } from "@stats47/data-configs/content/href";
import { buildCityPageMeta } from "@stats47/ranking";

import Link from "@/components/atoms/SiteLink";
import { PageHeader, PageShell, PanelGrid } from "@/components/layout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

import {
  CityDatabookView,
  CityPageFooter,
  getCityRouteContext,
} from "@/features/area-profile";
import { readCityDatabook } from "@/features/area-profile/server";
import { RelatedContentNavigation } from "@/features/content-navigation/RelatedContentNavigation";

import { ogpImageKeys, ogpImageUrl } from "@/lib/metadata/ogp-image";
import { UrlPolicy } from "@/lib/url-policy";

import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ areaCode: string; cityCode: string }>;
}

/**
 * データブックは公開対象の市区町村にだけある。対象外 (政令指定都市の行政区・「特別区部」の集約行) は
 * R2 を読まずに索引から外す。
 */
async function readDatabook(areaCode: string, cityCode: string) {
  return UrlPolicy.city.isIndexable(areaCode, cityCode)
    ? readCityDatabook(areaCode, cityCode)
    : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaCode, cityCode } = await params;
  const context = getCityRouteContext(areaCode, cityCode);
  if (!context) {
    return { title: "市区町村が見つかりません", robots: "noindex, follow" };
  }

  const databook = await readDatabook(areaCode, cityCode);
  const { title, description } = databook
    ? buildCityPageMeta(databook, context.pref.areaName)
    : {
        title: `${context.cityShortName}（${context.pref.areaName}）の統計データ`,
        description: `${context.city.areaName}の統計データ。`,
      };

  return {
    title,
    description,
    robots: databook ? "index, follow" : "noindex, follow",
    alternates: { canonical: hrefFor("city", { areaCode, cityCode }) },
    // 親県の静的 R2 OGP を明示。未指定だと最寄りの areas/[areaCode]/opengraph-image (ランタイム) に
    // 落ち Cloudflare Worker で 500 になる (正典: .claude/rules/ogp-image-standards.md §3 課題0)。
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: ogpImageUrl(ogpImageKeys.area(areaCode)), width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary", title, description },
  };
}

/**
 * オンデマンド ISR（24時間）。
 *
 * generateStaticParams は付けない。付けると対象市区町村が `●` SSG 化され、ビルド時に R2 から
 * データブックを読めず notFound として prerender される。この OpenNext 構成では ISR 再生成が
 * 効かず「市区町村が見つかりません」が永久固着する（2026-06-22 障害）。generateStaticParams なし =
 * `ƒ`（オンデマンド）でランタイムに R2 を読んで描画する（ranking / areas と同方式）。
 * 詳細: .claude/rules/nextjs-ssg-preservation.md
 */
export const revalidate = 86400;

/** 関連記事を探すときに使う指標の数 (見出しの指標と、データブックの先頭の分野)。 */
const RELATED_METRIC_LIMIT = 12;

export default async function CityPage({ params }: PageProps) {
  const { areaCode, cityCode } = await params;
  const context = getCityRouteContext(areaCode, cityCode);
  if (!context) {
    notFound();
  }

  const databook = await readDatabook(areaCode, cityCode);
  const meta = databook ? buildCityPageMeta(databook, context.pref.areaName) : null;
  const relatedMetricKeys = databook
    ? [...new Set([...databook.headlineKeys, ...databook.sections.flatMap((section) => section.metricKeys)])].slice(
        0,
        RELATED_METRIC_LIMIT,
      )
    : [];

  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: "ホーム", href: "/" },
          { label: "都道府県一覧", href: "/areas" },
          { label: context.pref.areaName, href: hrefFor("area", { areaCode }) },
          { label: context.cityShortName },
        ]}
      />
      <PageHeader
        eyebrow={
          <Link href={hrefFor("area", { areaCode })} className="hover:text-foreground hover:underline">
            {context.pref.areaName}
          </Link>
        }
        title={`${context.cityShortName}の${databook ? "人口・" : ""}統計データ`}
        description={meta?.description ?? `${context.pref.areaName}の市区町村`}
      />

      {/* main はルートレイアウトの main#main-content だけ (ページ内で入れ子にしない) */}
      <PanelGrid>
        {databook ? (
          <CityDatabookView
            databook={databook}
            cityShortName={context.cityShortName}
            prefName={context.pref.areaName}
          />
        ) : (
          <p role="status" className="border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
            この地域の統計データは、市区町村の一覧から各市区町村のページでご覧ください。
          </p>
        )}

        {databook && (
          <RelatedContentNavigation
            title="この市区町村のデータを読み解く記事"
            sourceId={`city:${areaCode}:${cityCode}`}
            kinds={["blog"]}
            rankingKeys={relatedMetricKeys}
            limit={3}
            surface="municipality_related"
          />
        )}

        <CityPageFooter
          areaCode={areaCode}
          prefName={context.pref.areaName}
          activeCityCode={cityCode}
        />
      </PanelGrid>
    </PageShell>
  );
}
