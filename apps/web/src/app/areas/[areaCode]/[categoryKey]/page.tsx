import Link from "next/link";
import { notFound } from "next/navigation";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import { isOk } from "@stats47/types";

import { FurusatoNozeiCard } from "@/features/ads";
import { AreaBannerAd } from "@/features/ads/server";
import {
    AreaProfilePageClient,
    CitiesNavCard,
    RelatedAreas,
    generateAreaCategoryMetadata,
    generateAreaProfileBreadcrumbStructuredData,
    generateAreaProfileStructuredData,
} from "@/features/area-profile";
import { getAreaProfileAction, AreaDashboardSection } from "@/features/area-profile/server";
import { listCategories } from "@/features/category/server";


import { AdSenseAd, CONTENT_FOOTER } from "@/lib/google-adsense";
import { UrlPolicy } from "@/lib/url-policy";

import type { Metadata } from "next";






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

    // title / description 差別化（#77 Phase 5）
    // 47 × N カテゴリで同一テンプレートだった title に「47 都道府県ランキング比較」を
    // 追加して GSC の duplicate canonical を回避。
    const title = `${profile.areaName}の${category.categoryName}データ｜47都道府県ランキング比較`;
    const description = `${profile.areaName}の${category.categoryName}分野の統計データ一覧。全国 47 都道府県で${profile.areaName}は何位か、グラフと地図で比較できます。`;
    const indexable = UrlPolicy.area.isIndexableCategory(categoryKey);

    return generateAreaCategoryMetadata({ title, description, areaCode, categoryKey, indexable });
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

                    {/* 関連エリア + 市区町村ナビ */}
                    <RelatedAreas areaCode={areaCode} />
                    <CitiesNavCard areaCode={areaCode} areaName={profile.areaName} />

                    {/* ふるさと納税 */}
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
