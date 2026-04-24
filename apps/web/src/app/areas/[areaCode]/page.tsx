import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchCities, fetchPrefectures } from "@stats47/area";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";
import { getDrizzle } from "@stats47/database/server";
import { isOk } from "@stats47/types";

import { SetSidebarSection } from "@/components/molecules/SetSidebarSection";

import { FurusatoNozeiCard } from "@/features/ads";
import { AreaBannerAd } from "@/features/ads/server";
import {
    AreaProfilePageClient,
    AreaProfileSidebar,
    AreaChartSection,
    RelatedAreas,
    CategoryNavGrid,
    generateAreaProfileBreadcrumbStructuredData,
    generateAreaProfileStructuredData,
} from "@/features/area-profile";
import { getAreaProfileAction } from "@/features/area-profile/server";
import { listCategories } from "@/features/category/server";


import type { Metadata } from "next";


/** ビルド時に全47都道府県を事前生成（DB利用不可時はISRに委ねる） */
export function generateStaticParams() {
    try {
        getDrizzle();
    } catch {
        return [];
    }
    const prefectures = fetchPrefectures();
    return prefectures.map((p) => ({ areaCode: p.prefCode }));
}

interface PageProps {
    params: Promise<{ areaCode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { areaCode } = await params;
    const profile = await getAreaProfileAction(areaCode);

    if (!profile) {
        return {
            title: "地域の特徴が見つかりません",
            description: "指定された地域のデータは存在しません。",
        };
    }

    // title / description 差別化（#77 Phase 4）
    // 47 都道府県全てで同一テンプレートだった title を「県の top 強み指標」で差別化。
    // 例: "東京都の統計データ" → "東京都の統計データ｜卸売業年間商品販売額 全国1位 | 47都道府県比較"
    const topStrength = profile.strengths[0];
    const title = topStrength
      ? `${profile.areaName}の統計データ｜${topStrength.indicator} 全国${topStrength.rank}位｜47都道府県比較`
      : `${profile.areaName}の統計データ｜47都道府県比較`;
    const descriptionHighlights = profile.strengths
      .slice(0, 3)
      .map((s) => `${s.indicator} 全国${s.rank}位`)
      .join("、");
    const description = descriptionHighlights
      ? `${profile.areaName}の統計プロファイル。${descriptionHighlights}。人口・経済・教育など17カテゴリのデータを全国ランキングで比較。`
      : `${profile.areaName}の特徴を統計データから分析。人口・経済・教育など17カテゴリのデータを全国ランキングで比較。`;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.jp";
    const imageUrl = `${baseUrl}/areas/${areaCode}/opengraph-image`;

    return {
        title,
        description,
        alternates: {
            canonical: `/areas/${areaCode}`,
        },
        openGraph: {
            title,
            description,
            type: "website",
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [imageUrl],
        },
    };
}

export default async function AreaProfilePage({ params }: PageProps) {
    const { areaCode } = await params;
    const profile = await getAreaProfileAction(areaCode);

    if (!profile) {
        notFound();
    }

    const categoriesResult = await listCategories();
    const categories = isOk(categoriesResult) ? categoriesResult.data : [];

    const [structuredData, breadcrumbStructuredData] = await Promise.all([
        Promise.resolve(generateAreaProfileStructuredData({ profile })),
        Promise.resolve(generateAreaProfileBreadcrumbStructuredData({ profile })),
    ]);

    return (
        <>
            {/* 構造化データ */}
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
                            <BreadcrumbPage>{profile.areaName}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* ヘッダー + ヒーロー */}
            <AreaProfilePageClient profile={profile} />

            {/* 左サイドバーに強み・弱み + 市区町村リストを注入 */}
            <SetSidebarSection>
                <AreaProfileSidebar
                    strengths={profile.strengths}
                    weaknesses={profile.weaknesses}
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
                    {/* DB管理チャート */}
                    <AreaChartSection
                        areaCode={areaCode}
                        areaName={profile.areaName}
                    />

                    {/* カテゴリナビゲーション */}
                    <CategoryNavGrid
                        categories={categories}
                        areaCode={areaCode}
                    />

                    {/* 関連エリア */}
                    <RelatedAreas areaCode={areaCode} />

                    {/* アフィリエイト */}
                    <AreaBannerAd />
                    <FurusatoNozeiCard areaCode={areaCode} />
                </main>
            </div>
        </>
    );
}
