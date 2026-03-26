import {
    CompareGridLayout,
    RegionComparisonClient,
    REGION_A_COLOR,
    REGION_B_COLOR,
    type ChoroplethMapData,
} from "@/features/region-comparison";
import type { ComparisonRegion } from "@/features/region-comparison";
import { fetchChoroplethMapData } from "@/features/region-comparison/server";
import { generateOGMetadata } from "@/lib/metadata/og-generator";
import { fetchPrefectures } from "@stats47/area";
import { listCategories } from "@/features/category/server";
import { unwrap } from "@stats47/types";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 86400;

/** areas パラメータを検証・パースする（5桁数字のカンマ区切り、最大2件） */
function parseAreaCodes(areas: string | undefined): string[] {
    if (!areas) return ["13000", "27000"];
    const codes = areas.split(",").filter(Boolean);
    const valid = codes.filter((c) => /^\d{5}$/.test(c));
    if (valid.length === 0) return ["13000", "27000"];
    return valid.slice(0, 2);
}

interface PageProps {
    params: Promise<{ categoryKey: string }>;
    searchParams: Promise<{
        areas?: string;
    }>;
}

/**
 * メタデータの生成
 */
export async function generateMetadata({
    params,
    searchParams,
}: PageProps): Promise<Metadata> {
    const { categoryKey } = await params;
    const { areas } = await searchParams;
    const areaCodes = parseAreaCodes(areas);

    const categories = unwrap(await listCategories());
    const category = categories.find((c) => c.categoryKey === categoryKey);
    if (!category) return {};

    const canonical = `/compare/${categoryKey}`;

    if (areaCodes.length === 0) {
        const title = "地域間比較 | stats47";
        const description = "2つの都道府県の統計データをカテゴリ別に比較できます。";
        return {
            title,
            description,
            alternates: { canonical },
            ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
        };
    }

    const allPrefectures = fetchPrefectures();
    const areaNames = areaCodes
        .map((code) => allPrefectures.find((p) => p.prefCode === code)?.prefName)
        .filter(Boolean);

    const title = `${areaNames.join(" vs ")} の地域間比較（${category.categoryName}） | stats47`;
    const description = `${areaNames.join("、")}の${category.categoryName}に関する統計データを比較します。`;

    return {
        title,
        description,
        alternates: { canonical },
        ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
    };
}

/**
 * 地域間比較ページ（カテゴリ別）
 */
export default async function CompareCategoryPage({ params, searchParams }: PageProps) {
    const { categoryKey } = await params;
    const { areas } = await searchParams;
    const categories = unwrap(await listCategories());

    // カテゴリが存在しなければ 404
    if (!categories.some((c) => c.categoryKey === categoryKey)) {
        notFound();
    }

    const areaCodes = parseAreaCodes(areas);

    // 比較対象地域の構築（2地域選択時のみ）
    const regions: [ComparisonRegion, ComparisonRegion] | null =
        areaCodes.length === 2
            ? (() => {
                const prefectures = fetchPrefectures();
                const colors = [REGION_A_COLOR, REGION_B_COLOR] as const;
                return areaCodes.map((code, i) => ({
                    areaCode: code,
                    areaName: prefectures.find((p) => p.prefCode === code)?.prefName ?? code,
                    color: colors[i],
                })) as [ComparisonRegion, ComparisonRegion];
            })()
            : null;

    // 市区町村コロプレスマップデータ（population カテゴリ）
    const choroplethMapData = await fetchChoroplethMapData(categoryKey, areaCodes);

    // loadPageComponents で全コンポーネントを一括取得（KPI + チャート）
    const { loadPageComponents } = await import("@/features/stat-charts/services/load-page-components");
    const allPageComponents = areaCodes.length === 2
        ? await loadPageComponents("area-category", categoryKey)
        : [];

    // KPI とチャートを分離
    const kpiPageComponents = allPageComponents.filter(
        (c) => c.componentType === "kpi-card" || c.componentType === "attribute-matrix"
    );
    const chartPageComponents = allPageComponents.filter(
        (c) => c.componentType !== "kpi-card" && c.componentType !== "attribute-matrix"
    );

    // KPI → page_components 形式に変換
    const kpiComponents = kpiPageComponents.map((c) => ({
        id: c.componentKey,
        categoryKey,
        componentType: c.componentType,
        displayOrder: c.sortOrder,
        gridColumnSpan: c.gridColumnSpan,
        gridColumnSpanTablet: c.gridColumnSpanTablet,
        gridColumnSpanSm: c.gridColumnSpanSm,
        title: c.title,
        componentProps: JSON.stringify(c.componentProps),
        rankingLink: c.rankingLink,
        sectionLabel: c.section,
        isActive: true,
        sourceLink: c.sourceLink,
        sourceName: c.sourceName,
        areaType: "prefecture" as const,
        dataSource: c.dataSource,
        createdAt: null,
        updatedAt: null,
    }));

    // チャート → page_components 形式に変換
    const chartComponents = chartPageComponents.map((c) => ({
        id: c.componentKey,
        categoryKey,
        componentType: c.componentType,
        displayOrder: c.sortOrder,
        gridColumnSpan: c.gridColumnSpan,
        gridColumnSpanTablet: c.gridColumnSpanTablet,
        gridColumnSpanSm: c.gridColumnSpanSm,
        title: c.title,
        componentProps: JSON.stringify(c.componentProps),
        rankingLink: c.rankingLink,
        sectionLabel: c.section,
        isActive: true,
        sourceLink: c.sourceLink,
        sourceName: c.sourceName,
        areaType: "prefecture" as const,
        dataSource: c.dataSource,
        createdAt: null,
        updatedAt: null,
    }));

    const comparisonComponents = [...kpiComponents, ...chartComponents];

    return (
        <div className="container mx-auto px-4 py-6">
            <RegionComparisonClient
                regions={regions}
                categories={categories}
                currentCategoryKey={categoryKey}
                selectedAreaCodes={areaCodes}
                choroplethMapData={choroplethMapData}
            >
                {regions && comparisonComponents.length > 0 && (
                    <CompareGridLayout regions={regions} components={comparisonComponents} />
                )}
            </RegionComparisonClient>
        </div>
    );
}
