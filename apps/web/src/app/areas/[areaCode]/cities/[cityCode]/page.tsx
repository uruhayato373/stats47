import Link from "next/link";
import { notFound } from "next/navigation";

import { isOk } from "@stats47/types";

import { PageHeader, PageShell } from "@/components/layout";
import { readCityCategoryKeysFromR2 } from "@/components/stat-charts/server";
import { SurfaceSection } from "@/components/surface";

import {
  CategoryNavGrid,
  CityBreadcrumbs,
  CityPageFooter,
  getCityRouteContext,
} from "@/features/area-profile";
import { readCityProfile } from "@/features/area-profile/server";
import { listCategories } from "@/features/category/server";

import { ogpImageKeys, ogpImageUrl } from "@/lib/metadata/ogp-image";
import { UrlPolicy } from "@/lib/url-policy";

import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ areaCode: string; cityCode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaCode, cityCode } = await params;
  const context = getCityRouteContext(areaCode, cityCode);
  if (!context) {
    return { title: "市区町村が見つかりません", robots: "noindex, follow" };
  }

  const profile = await readCityProfile(areaCode, cityCode);
  const validStrengths = profile?.strengths.filter((s) => s.rank >= 1 && s.rank <= 5) ?? [];
  const topStrength = validStrengths[0];

  const title = topStrength
    ? `${context.city.areaName}の統計データ｜${context.pref.areaName}｜${topStrength.indicator} 県内${topStrength.rank}位`
    : `${context.city.areaName}の統計データ｜${context.pref.areaName}`;

  const descriptionHighlights = validStrengths
    .slice(0, 3)
    .map((s) => `${s.indicator} 県内${s.rank}位`)
    .join("、");
  const description = descriptionHighlights
    ? `${context.city.areaName}（${context.pref.areaName}）の統計プロファイル。${descriptionHighlights}。県内ランキングで主要指標を比較できます。`
    : `${context.city.areaName}（${context.pref.areaName}）の統計データをチャートで可視化。`;

  return {
    title,
    description,
    robots: UrlPolicy.city.isIndexable(areaCode, cityCode)
      ? "index, follow"
      : "noindex, follow",
    alternates: { canonical: `/areas/${areaCode}/cities/${cityCode}` },
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
 * city profile を読めず notFound として prerender される。この OpenNext 構成では ISR 再生成が
 * 効かず「市区町村が見つかりません」が永久固着する（2026-06-22 障害）。generateStaticParams なし =
 * `ƒ`（オンデマンド）でランタイムに R2 を読んで描画する（ranking / areas と同方式）。
 * 詳細: .claude/rules/nextjs-ssg-preservation.md
 */
export const revalidate = 86400;

export default async function CityPage({ params }: PageProps) {
  const { areaCode, cityCode } = await params;
  const context = getCityRouteContext(areaCode, cityCode);
  if (!context) {
    notFound();
  }

  const [categoriesResult, profile] = await Promise.all([
    listCategories(),
    readCityProfile(areaCode, cityCode),
  ]);
  const allCategories = isOk(categoriesResult) ? categoriesResult.data : [];
  const validStrengths = profile?.strengths.filter((s) => s.rank >= 1 && s.rank <= 5) ?? [];

  let filteredCategories = allCategories;
  const cityCategoryKeys = await readCityCategoryKeysFromR2();
  if (cityCategoryKeys.length > 0) {
    const categoriesWithData = new Set(cityCategoryKeys);
    filteredCategories = allCategories.filter((c) => categoriesWithData.has(c.categoryKey));
  }

  return (
    <PageShell>
      <CityBreadcrumbs
        areaCode={areaCode}
        prefName={context.pref.areaName}
        cityName={context.city.areaName}
      />
      <PageHeader
        title={`${context.city.areaName}の統計データ`}
        description={`${context.pref.areaName} ${context.city.areaName}`}
      />

      <main className="min-w-0 space-y-10">
        {validStrengths.length > 0 ? (
          <SurfaceSection className="p-6">
            <h2 className="text-lg font-bold text-foreground">
              {context.city.areaName}の強み (県内ランキング上位)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {context.pref.areaName}内で {context.city.areaName} が上位 5 位以内に入る指標
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {validStrengths.map((strength) => (
                <li
                  key={strength.rankingKey}
                  className="flex items-baseline justify-between gap-3 rounded border border-border bg-background p-3"
                >
                  <Link
                    href={`/ranking/${strength.rankingKey}`}
                    className="text-sm font-medium hover:text-primary hover:underline"
                  >
                    {strength.indicator}
                  </Link>
                  <span className="shrink-0 text-xs font-mono text-muted-foreground">
                    県内 {strength.rank} 位 ({strength.value.toLocaleString("ja-JP")} {strength.unit})
                  </span>
                </li>
              ))}
            </ul>
          </SurfaceSection>
        ) : null}

        <CategoryNavGrid
          categories={filteredCategories}
          areaCode={cityCode}
          basePath={context.cityBasePath}
        />

        <CityPageFooter
          areaCode={areaCode}
          prefName={context.pref.areaName}
          activeCityCode={cityCode}
        />
      </main>
    </PageShell>
  );
}
