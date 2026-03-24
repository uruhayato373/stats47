import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchCities, lookupArea } from "@stats47/area";
import { listCategories } from "@/features/category/server";
import { getComparisonRepository } from "@stats47/database/server";
import { isOk } from "@stats47/types";
import type { Metadata } from "next";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";

import { CategoryNavGrid } from "@/features/area-profile";
import { SetSidebarSection } from "@/components/molecules/SetSidebarSection";
import { FurusatoNozeiCard } from "@/features/ads";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

export const revalidate = 86400;

interface PageProps {
    params: Promise<{ areaCode: string; cityCode: string }>;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { areaCode, cityCode } = await params;

    const city = lookupArea(cityCode);
    if (!city || city.areaType !== "city" || city.parentAreaCode !== areaCode) {
        return { title: "市区町村が見つかりません" };
    }

    const pref = lookupArea(areaCode);
    const prefName = pref?.areaName ?? "";
    const title = `${city.areaName}の統計データ`;
    const description = `${city.areaName}（${prefName}）の統計データをチャートで可視化。`;

    return {
        title,
        description,
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

    const [categoriesResult, componentsResult] = await Promise.all([
        listCategories(),
        getComparisonRepository().listComponentsByAreaType("city"),
    ]);
    const allCategories = isOk(categoriesResult) ? categoriesResult.data : [];
    const allComponents = isOk(componentsResult) ? componentsResult.data : [];

    // データがあるカテゴリのみ抽出
    const categoriesWithData = new Set(allComponents.map((c) => c.categoryKey));
    const filteredCategories = allCategories.filter((c) => categoriesWithData.has(c.categoryKey));

    const cityBasePath = `/areas/${areaCode}/cities/${cityCode}`;
    const allCities = fetchCities().filter((c) => c.prefCode === areaCode);

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
                    <h1 className="text-2xl font-bold">
                        {city.areaName}の統計データ
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        {pref.areaName} {city.areaName}
                    </p>
                </div>
            </div>

            {/* 左サイドバーに市区町村リストを注入 */}
            {allCities.length > 0 && (
                <SetSidebarSection>
                    <Card>
                        <CardHeader className="py-3 px-3">
                            <CardTitle className="text-base">{pref.areaName}の市区町村</CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                            <nav className="flex flex-col gap-0.5 max-h-[40vh] overflow-y-auto">
                                {allCities.map((c) => (
                                    <Link
                                        key={c.cityCode}
                                        href={`/areas/${areaCode}/cities/${c.cityCode}`}
                                        className={`text-xs px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors ${
                                            c.cityCode === cityCode ? "bg-accent font-medium" : ""
                                        }`}
                                    >
                                        {c.cityName}
                                    </Link>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>
                </SetSidebarSection>
            )}

            {/* 1カラムレイアウト */}
            <div className="container mx-auto px-4 py-10">
                <main className="min-w-0 space-y-10">
                    <CategoryNavGrid
                        categories={filteredCategories}
                        areaCode={cityCode}
                        basePath={cityBasePath}
                    />

                    {/* ふるさと納税 */}
                    <FurusatoNozeiCard areaCode={areaCode} />
                </main>
            </div>
        </>
    );
}
