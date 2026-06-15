import Link from "next/link";
import { notFound } from "next/navigation";

import { lookupArea } from "@stats47/area";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import { isOk } from "@stats47/types";

import { PageShell, PageHeader } from "@/components/layout";

import { FurusatoNozeiCard } from "@/features/ads";
import { AreaBannerAd } from "@/features/ads/server";
import { CitiesNavCard } from "@/features/area-profile";
import { AreaDashboardSection } from "@/features/area-profile/server";
import { listCategories } from "@/features/category/server";

import { AdSenseAd, CONTENT_FOOTER } from "@/lib/google-adsense";
import { UrlPolicy } from "@/lib/url-policy";

import type { Metadata } from "next";






interface PageProps {
    params: Promise<{ areaCode: string; cityCode: string; categoryKey: string }>;
    searchParams: Promise<{ ranking?: string }>;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { areaCode, cityCode, categoryKey } = await params;

    const city = lookupArea(cityCode);
    if (!city || city.areaType !== "city" || city.parentAreaCode !== areaCode) {
        return { title: "市区町村が見つかりません" };
    }

    const pref = lookupArea(areaCode);
    const prefName = pref?.areaName ?? "";
    const categoriesResult = await listCategories();
    const categories = isOk(categoriesResult) ? categoriesResult.data : [];
    const category = categories.find((c) => c.categoryKey === categoryKey);

    if (!category) return { title: "カテゴリが見つかりません" };

    const title = `${city.areaName}の${category.categoryName}データ`;
    const description = `${city.areaName}（${prefName}）の${category.categoryName}に関する統計データをチャートで可視化。`;

    // 県カテゴリと同じ allowlist (population/economy) のみ index。他は noindex,follow。
    // sitemap (UrlPolicy.cityCategory.indexableCategories) と完全一致させる。
    const robots = UrlPolicy.cityCategory.isIndexableCategory(categoryKey)
        ? "index, follow"
        : "noindex, follow";

    return {
        title,
        description,
        alternates: { canonical: `/areas/${areaCode}/cities/${cityCode}/${categoryKey}` },
        robots,
        openGraph: { title, description, type: "website" },
        twitter: { card: "summary", title, description },
    };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CityCategoryPage({ params, searchParams }: PageProps) {
    const { areaCode, cityCode, categoryKey } = await params;
    const { ranking } = await searchParams;

    const city = lookupArea(cityCode);
    if (!city || city.areaType !== "city" || city.parentAreaCode !== areaCode) {
        notFound();
    }

    const pref = lookupArea(areaCode);
    if (!pref || pref.areaType !== "prefecture") {
        notFound();
    }

    const categoriesResult = await listCategories();
    const categories = isOk(categoriesResult) ? categoriesResult.data : [];
    const category = categories.find((c) => c.categoryKey === categoryKey);
    if (!category) notFound();

    const cityBasePath = `/areas/${areaCode}/cities/${cityCode}`;
    const area = {
        areaCode: cityCode,
        areaName: city.areaName,
        areaType: "city" as const,
        parentAreaCode: areaCode,
    };


    return (
        <PageShell>
            {/* パンくずナビゲーション */}
            <Breadcrumb className="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/">ホーム</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/areas">都道府県一覧</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href={`/areas/${areaCode}`}>{pref.areaName}</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href={cityBasePath}>{city.areaName}</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{category.categoryName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* ヘッダー */}
            <PageHeader
                title={`${city.areaName}の${category.categoryName}データ`}
                description={`${pref.areaName} ${city.areaName}`}
            />

            {/* 1カラムレイアウト */}
            <main className="min-w-0 space-y-10">
                <AreaDashboardSection
                        area={area}
                        categoryKey={categoryKey}
                        categories={categories}
                        basePath={cityBasePath}
                        selectedRankingKey={ranking}
                    />

                    {/* 同一県の他市区町村ナビ */}
                    <CitiesNavCard
                        areaCode={areaCode}
                        areaName={pref.areaName}
                        activeCityCode={cityCode}
                    />

                    {/* アフィリエイト */}
                    <AreaBannerAd />
                    <FurusatoNozeiCard areaCode={areaCode} />

                    <div className="mt-8">
                        <AdSenseAd format={CONTENT_FOOTER.format} slotId={CONTENT_FOOTER.slotId} />
                    </div>
            </main>
        </PageShell>
    );
}
