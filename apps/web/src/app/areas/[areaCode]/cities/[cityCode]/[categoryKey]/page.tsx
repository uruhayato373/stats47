import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchCities, lookupArea } from "@stats47/area";
import { listCategories } from "@/features/category/server";
import { isOk } from "@stats47/types";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";
import type { Metadata } from "next";

import { CategorySelect } from "@/features/area-profile";
import { AreaDashboardSection } from "@/features/area-profile/server";
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

    return {
        title,
        description,
        alternates: { canonical: `/areas/${areaCode}/cities/${cityCode}/${categoryKey}` },
        robots: "noindex, follow",
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
            </div>

            {/* ヘッダー */}
            <div className="container mx-auto px-4 pt-6">
                <div className="border-b pb-4">
                    <h1 className="text-lg font-bold">
                        {city.areaName}の{category.categoryName}データ
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        {pref.areaName} {city.areaName}
                    </p>
                </div>
            </div>

            {/* 左サイドバーにカテゴリ選択 + 市区町村リストを注入 */}
            <SetSidebarSection>
                <CategorySelect
                    categories={categories}
                    currentCategoryKey={categoryKey}
                    areaCode={cityCode}
                    basePath={cityBasePath}
                />
                {allCities.length > 0 && (
                    <Card className="mt-4">
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
                )}
            </SetSidebarSection>

            {/* 1カラムレイアウト */}
            <div className="container mx-auto px-4 py-10">
                <main className="min-w-0 space-y-10">
                    <AreaDashboardSection
                        area={area}
                        categoryKey={categoryKey}
                        categories={categories}
                        basePath={cityBasePath}
                        selectedRankingKey={ranking}
                    />

                    {/* ふるさと納税 */}
                    <FurusatoNozeiCard areaCode={areaCode} />
                </main>
            </div>
        </>
    );
}
