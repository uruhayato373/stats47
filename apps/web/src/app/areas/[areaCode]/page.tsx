import Link from "next/link";
import { notFound } from "next/navigation";

import {
    AreaProfilePageClient,
    AreaProfileSidebar,
    RelatedAreas,
    CategoryNavGrid,
    generateAreaProfileBreadcrumbStructuredData,
    generateAreaProfileStructuredData,
} from "@/features/area-profile";
import { SetSidebarSection } from "@/components/molecules/SetSidebarSection";
import { getAreaProfileAction } from "@/features/area-profile/server";
import { FurusatoNozeiCard } from "@/features/ads";
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
import { fetchCities, fetchPrefectures } from "@stats47/area";
import { listCategories } from "@/features/category/server";
import { getDrizzle } from "@stats47/database/server";
import { isOk } from "@stats47/types";
import type { Metadata } from "next";

export const revalidate = 86400;

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

    const title = `${profile.areaName}の統計データ`;
    const description = `${profile.areaName}の特徴を統計データから分析。人口・経済・教育など17カテゴリのデータを全国ランキングで比較。`;

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
                    {/* カテゴリナビゲーション */}
                    <CategoryNavGrid
                        categories={categories}
                        areaCode={areaCode}
                    />

                    {/* 関連エリア */}
                    <RelatedAreas areaCode={areaCode} />

                    {/* ふるさと納税 */}
                    <FurusatoNozeiCard areaCode={areaCode} />
                </main>
            </div>
        </>
    );
}
