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
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import { isOk } from "@stats47/types";





import { FurusatoNozeiCard } from "@/features/ads";
import { AreaBannerAd } from "@/features/ads/server";
import { CategoryNavGrid, CitiesNavCard } from "@/features/area-profile";
import { listCategories } from "@/features/category/server";
import {
    PAGE_COMPONENTS_SNAPSHOT_KEY,
    type PageComponentsSnapshot,
} from "@/features/stat-charts/server";

import { AdSenseAd, CONTENT_FOOTER } from "@/lib/google-adsense";

import type { Metadata } from "next";



interface PageProps {
    params: Promise<{ areaCode: string; cityCode: string }>;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface CityProfileData {
    areaCode: string;
    areaName: string;
    strengths: Array<{
        indicator: string;
        rankingKey: string;
        year: string;
        rank: number;
        value: number;
        unit: string;
    }>;
    weaknesses: Array<{
        indicator: string;
        rankingKey: string;
        year: string;
        rank: number;
        value: number;
        unit: string;
    }>;
}

async function readCityProfile(areaCode: string, cityCode: string): Promise<CityProfileData | null> {
    try {
        return await fetchFromR2AsJson<CityProfileData>(
            `app/areas/${areaCode}/cities/${cityCode}/profile.json`
        );
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { areaCode, cityCode } = await params;

    const city = lookupArea(cityCode);
    if (!city || city.areaType !== "city" || city.parentAreaCode !== areaCode) {
        return { title: "市区町村が見つかりません" };
    }

    const pref = lookupArea(areaCode);
    const prefName = pref?.areaName ?? "";

    // R2 から city profile を取得 (rank>=1 の強みのみ)
    const profile = await readCityProfile(areaCode, cityCode);
    const validStrengths = profile?.strengths.filter((s) => s.rank >= 1 && s.rank <= 5) ?? [];
    const topStrength = validStrengths[0];

    const title = topStrength
        ? `${city.areaName}の統計データ｜${prefName}｜${topStrength.indicator} 県内${topStrength.rank}位`
        : `${city.areaName}の統計データ｜${prefName}`;

    const descriptionHighlights = validStrengths
        .slice(0, 3)
        .map((s) => `${s.indicator} 県内${s.rank}位`)
        .join("、");
    const description = descriptionHighlights
        ? `${city.areaName}（${prefName}）の統計プロファイル。${descriptionHighlights}。県内ランキングで主要指標を比較できます。`
        : `${city.areaName}（${prefName}）の統計データをチャートで可視化。`;

    return {
        title,
        description,
        robots: "index, follow",
        alternates: { canonical: `/areas/${areaCode}/cities/${cityCode}` },
        openGraph: { title, description, type: "website" },
        twitter: { card: "summary", title, description },
    };
}

// ---------------------------------------------------------------------------
// Static Params
// ---------------------------------------------------------------------------

export function generateStaticParams() {
    return [];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CityPage({ params }: PageProps) {
    const { areaCode, cityCode } = await params;

    const city = lookupArea(cityCode);
    if (!city || city.areaType !== "city" || city.parentAreaCode !== areaCode) {
        notFound();
    }

    const pref = lookupArea(areaCode);
    if (!pref || pref.areaType !== "prefecture") {
        notFound();
    }

    const [categoriesResult, profile] = await Promise.all([
        listCategories(),
        readCityProfile(areaCode, cityCode),
    ]);
    const allCategories = isOk(categoriesResult) ? categoriesResult.data : [];
    const validStrengths = profile?.strengths.filter((s) => s.rank >= 1 && s.rank <= 5) ?? [];

    // page_component_assignments から city-category のカテゴリを取得 (R2 snapshot 経由)
    let filteredCategories = allCategories;
    try {
        const snapshot = await fetchFromR2AsJson<PageComponentsSnapshot>(
            PAGE_COMPONENTS_SNAPSHOT_KEY,
        );
        if (snapshot) {
            const categoriesWithData = new Set<string>();
            for (const key of Object.keys(snapshot.byPage)) {
                const [pageType, pageKey] = key.split("|");
                if (pageType === "city-category" && pageKey) {
                    categoriesWithData.add(pageKey);
                }
            }
            filteredCategories = allCategories.filter((c) => categoriesWithData.has(c.categoryKey));
        }
    } catch { /* snapshot 不在時は全カテゴリ表示 */ }

    const cityBasePath = `/areas/${areaCode}/cities/${cityCode}`;

    return (
        <>
            {/* パンくずナビゲーション */}
            <div className="container mx-auto px-4 pt-4">
                <Breadcrumb>
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
                            <BreadcrumbPage>{city.areaName}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* ヘッダー */}
            <div className="container mx-auto px-4 pt-6">
                <div className="border-b pb-4">
                    <h1 className="text-lg font-bold">
                        {city.areaName}の統計データ
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        {pref.areaName} {city.areaName}
                    </p>
                </div>
            </div>

            {/* 1カラムレイアウト */}
            <div className="container mx-auto px-4 py-10">
                <main className="min-w-0 space-y-10">
                    {validStrengths.length > 0 && (
                        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-foreground">
                                {city.areaName}の強み (県内ランキング上位)
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {pref.areaName}内で {city.areaName} が上位 5 位以内に入る指標
                            </p>
                            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {validStrengths.map((s) => (
                                    <li
                                        key={s.rankingKey}
                                        className="flex items-baseline justify-between gap-3 rounded border border-border bg-background p-3"
                                    >
                                        <Link
                                            href={`/ranking/${s.rankingKey}`}
                                            className="font-medium text-sm hover:underline hover:text-primary"
                                        >
                                            {s.indicator}
                                        </Link>
                                        <span className="shrink-0 text-xs font-mono text-muted-foreground">
                                            県内 {s.rank} 位 (
                                            {s.value.toLocaleString("ja-JP")} {s.unit})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <CategoryNavGrid
                        categories={filteredCategories}
                        areaCode={cityCode}
                        basePath={cityBasePath}
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
            </div>
        </>
    );
}
