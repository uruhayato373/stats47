import { notFound } from "next/navigation";

import { isOk } from "@stats47/types";

import { PageHeader, PageShell } from "@/components/layout";

import { NativeAffiliateRow } from "@/features/ads";
import { CATEGORY_AFFILIATE_MAP } from "@/features/ads/constants/affiliate-category";
import { resolveAffiliateBannersByVertical } from "@/features/ads/server";
import {
  CityBreadcrumbs,
  CityPageFooter,
  getCityRouteContext,
} from "@/features/area-profile";
import { AreaDashboardSection } from "@/features/area-profile/server";
import { listCategories } from "@/features/category/server";

import { ogpImageKeys, ogpImageUrl } from "@/lib/metadata/ogp-image";
import { UrlPolicy } from "@/lib/url-policy";

import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ areaCode: string; cityCode: string; categoryKey: string }>;
  searchParams: Promise<{ ranking?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaCode, cityCode, categoryKey } = await params;
  const context = getCityRouteContext(areaCode, cityCode);
  if (!context) {
    return { title: "市区町村が見つかりません", robots: "noindex, follow" };
  }

  const categoriesResult = await listCategories();
  const categories = isOk(categoriesResult) ? categoriesResult.data : [];
  const category = categories.find((c) => c.categoryKey === categoryKey);
  if (!category) {
    return { title: "カテゴリが見つかりません", robots: "noindex, follow" };
  }

  const title = `${context.city.areaName}の${category.categoryName}データ`;
  const description = `${context.city.areaName}（${context.pref.areaName}）の${category.categoryName}に関する統計データをチャートで可視化。`;
  const robots =
    UrlPolicy.city.isIndexable(areaCode, cityCode) &&
    UrlPolicy.cityCategory.isIndexableCategory(categoryKey)
    ? "index, follow"
    : "noindex, follow";

  return {
    title,
    description,
    alternates: { canonical: `/areas/${areaCode}/cities/${cityCode}/${categoryKey}` },
    robots,
    // 親県の静的 R2 OGP を明示 (ランタイム opengraph-image への fallback = Worker 500 回避)。
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: ogpImageUrl(ogpImageKeys.area(areaCode)), width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function CityCategoryPage({ params, searchParams }: PageProps) {
  const { areaCode, cityCode, categoryKey } = await params;
  const { ranking } = await searchParams;
  const context = getCityRouteContext(areaCode, cityCode);
  if (!context) {
    notFound();
  }

  const categoriesResult = await listCategories();
  const categories = isOk(categoriesResult) ? categoriesResult.data : [];
  const category = categories.find((c) => c.categoryKey === categoryKey);
  if (!category) {
    notFound();
  }

  const area = {
    areaCode: cityCode,
    areaName: context.city.areaName,
    areaType: "city" as const,
    parentAreaCode: areaCode,
  };

  // URL の categoryKey (17 軸) → vertical。ranking / category ページと同じ写像
  const affiliateVertical = CATEGORY_AFFILIATE_MAP[categoryKey];
  const nativeBanners = affiliateVertical
    ? await resolveAffiliateBannersByVertical(affiliateVertical, 8).catch(() => [])
    : [];

  return (
    <PageShell>
      <CityBreadcrumbs
        areaCode={areaCode}
        prefName={context.pref.areaName}
        cityName={context.city.areaName}
        cityBasePath={context.cityBasePath}
        currentPage={category.categoryName}
      />
      <PageHeader
        title={`${context.city.areaName}の${category.categoryName}データ`}
        description={`${context.pref.areaName} ${context.city.areaName}`}
      />

      <main className="min-w-0 space-y-10">
        <AreaDashboardSection
          area={area}
          categoryKey={categoryKey}
          categories={categories}
          basePath={context.cityBasePath}
          selectedRankingKey={ranking}
        />

        {/* ネイティブアフィリエイト枠 (categoryKey → vertical。写像が無ければ描画しない) */}
        {nativeBanners.length > 0 && (
          <NativeAffiliateRow
            banners={nativeBanners}
            position="city-native"
            trackingCategory={`city-${categoryKey}`}
            variant="three-up"
          />
        )}

        <CityPageFooter
          areaCode={areaCode}
          prefName={context.pref.areaName}
          activeCityCode={cityCode}
        />
      </main>
    </PageShell>
  );
}
