import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchCities } from "@stats47/area";
import { listCategories } from "@/features/category/server";
import { isOk } from "@stats47/types";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";
import type { Metadata } from "next";

import {
    AreaProfilePageClient,
    CategorySelect,
    RelatedAreas,
    generateAreaProfileBreadcrumbStructuredData,
    generateAreaProfileStructuredData,
} from "@/features/area-profile";
import { getAreaProfileAction, AreaDashboardSection } from "@/features/area-profile/server";
import { SetSidebarSection } from "@/components/molecules/SetSidebarSection";
import { FurusatoNozeiCard, AreaBannerAd } from "@/features/ads";
import { INDEXABLE_AREA_CATEGORIES_SET } from "@/lib/indexable-area-categories";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

export const revalidate = 86400;

/** インデックス対象カテゴリ（共通定数） */
const INDEXABLE_CATEGORIES = INDEXABLE_AREA_CATEGORIES_SET;

interface PageProps {
    params: Promise<{ areaCode: string; categoryKey: string }>;
    searchParams: Promise<{ ranking?: string }>;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { areaCode, categoryKey } = await params;

    const profile = await getAreaProfileAction(areaCode);
    const categoriesResult = await listCategories();
    const categories = isOk(categoriesResult) ? categoriesResult.data : [];
    const category = categories.find((c) => c.categoryKey === categoryKey);

    if (!profile || !category) {
        return { title: "ページが見つかりません" };
    }

    const title = `${profile.areaName}の${category.categoryName}データ`;
    const description = `${profile.areaName}の${category.categoryName}に関する統計データ。全国ランキングで比較。`;
    const indexable = INDEXABLE_CATEGORIES.has(categoryKey);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.jp";
    const imageUrl = `${baseUrl}/areas/${areaCode}/opengraph-image`;

    return {
        title,
        description,
        alternates: {
            canonical: `/areas/${areaCode}/${categoryKey}`,
        },
        robots: indexable ? "index, follow" : "noindex, follow",
        openGraph: {
            title,
            description,
            type: "website",
            images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
        },
        twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
    };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AreaCategoryPage({ params, searchParams }: PageProps) {
    const { areaCode, categoryKey } = await params;
    const { ranking } = await searchParams;
    const profile = await getAreaProfileAction(areaCode);
    if (!profile) notFound();

    const categoriesResult = await listCategories();
    const categories = isOk(categoriesResult) ? categoriesResult.data : [];
    const category = categories.find((c) => c.categoryKey === categoryKey);
    if (!category) notFound();

    const area = { areaCode, areaName: profile.areaName, areaType: "prefecture" as const };

    const [structuredData, breadcrumbStructuredData] = await Promise.all([
        Promise.resolve(generateAreaProfileStructuredData({ profile })),
        Promise.resolve(generateAreaProfileBreadcrumbStructuredData({ profile })),
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
            />

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
                                <Link href={`/areas/${areaCode}`}>{profile.areaName}</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{category.categoryName}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* ヘッダー */}
            <AreaProfilePageClient profile={profile} />

            {/* 左サイドバーにカテゴリ選択 + 市区町村リストを注入 */}
            <SetSidebarSection>
                <CategorySelect
                    categories={categories}
                    currentCategoryKey={categoryKey}
                    areaCode={areaCode}
                    basePath={`/areas/${areaCode}`}
                />
                {(() => {
                    const cities = fetchCities().filter((c) => c.prefCode === areaCode);
                    if (cities.length === 0) return null;
                    return (
                        <Card className="mt-4">
                            <CardHeader className="py-3 px-3">
                                <CardTitle className="text-base">{profile.areaName}の市区町村</CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <nav className="flex flex-col gap-0.5 max-h-[40vh] overflow-y-auto">
                                    {cities.map((city) => (
                                        <Link
                                            key={city.cityCode}
                                            href={`/areas/${areaCode}/cities/${city.cityCode}`}
                                            className="text-xs px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                                        >
                                            {city.cityName}
                                        </Link>
                                    ))}
                                </nav>
                            </CardContent>
                        </Card>
                    );
                })()}
            </SetSidebarSection>

            {/* 1カラムレイアウト */}
            <div className="container mx-auto px-4 py-10">
                <main className="min-w-0 space-y-10">
                    <AreaDashboardSection
                        area={area}
                        categoryKey={categoryKey}
                        categories={categories}
                        basePath={`/areas/${areaCode}`}
                        selectedRankingKey={ranking}
                    />

                    {/* 関連エリア + ふるさと納税 */}
                    <RelatedAreas areaCode={areaCode} />
                    <AreaBannerAd />
                    <FurusatoNozeiCard areaCode={areaCode} />
                </main>
            </div>
        </>
    );
}
