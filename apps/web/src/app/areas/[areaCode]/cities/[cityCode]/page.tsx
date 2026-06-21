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
import { PHASE_1_SSG_CITIES } from "@/features/area-profile/constants/stage-1-cities";
import { readCityProfile } from "@/features/area-profile/server";
import { listCategories } from "@/features/category/server";

import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ areaCode: string; cityCode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaCode, cityCode } = await params;
  const context = getCityRouteContext(areaCode, cityCode);
  if (!context) {
    return { title: "市区町村が見つかりません" };
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
    robots: "index, follow",
    alternates: { canonical: `/areas/${areaCode}/cities/${cityCode}` },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export function generateStaticParams() {
  return PHASE_1_SSG_CITIES;
}

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
