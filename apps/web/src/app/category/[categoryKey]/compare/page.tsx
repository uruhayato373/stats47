import { notFound } from "next/navigation";

import { fetchPrefectures } from "@stats47/area";
import { unwrap } from "@stats47/types";
import { type Metadata } from "next";

import { PageShell } from "@/components/layout";

import { listCategories } from "@/features/category/server";
import {
    CompareGridLayout,
    RegionComparisonClient,
    REGION_A_COLOR,
    REGION_B_COLOR,
    type ComparisonRegion,
} from "@/features/region-comparison";
import { fetchChoroplethMapData } from "@/features/region-comparison/server";

import { AdSenseAd, COMPARE_PAGE_SIDEBAR } from "@/lib/google-adsense";
import { generateOGMetadata } from "@/lib/metadata/og-generator";


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
 *
 * 2026-05-28: /compare/[categoryKey] から /category/[categoryKey]/compare へ移行。
 * canonical を新パスに更新。
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

    const canonical = `/category/${categoryKey}/compare`;

    if (areaCodes.length === 0) {
        const title = "地域間比較 | stats47";
        const description = "2つの都道府県の統計データをカテゴリ別に比較できます。";
        return {
            title,
            description,
            alternates: { canonical },
            robots: "noindex, follow",
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
        robots: "noindex, follow",
        ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
    };
}

/**
 * 地域間比較ページ（カテゴリ別）
 *
 * 2026-05-28: /compare/[categoryKey] から /category/[categoryKey]/compare へ移行。
 * URL 構造整理 Phase 2: /compare サブパス全廃 → /category 配下に統合。
 * canonical 競合解消・サイト構造の対称化が目的。
 *
 * R2 データ source: `app/page-components/area-category/{categoryKey}.json`
 * (旧 /compare と同じデータ。キー名整理は将来 issue)
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

    // loadPageComponents で全コンポーネントを一括取得（R2 snapshot 経由）
    const { loadPageComponents } = await import("@/features/stat-charts/services/page-components-snapshot").then(
        (m) => ({ loadPageComponents: m.readPageComponentsFromR2 }),
    );
    const pageComponents = areaCodes.length === 2
        ? await loadPageComponents("area-category", categoryKey)
        : [];

    const currentCategory = categories.find((c) => c.categoryKey === categoryKey);

    return (
        <PageShell>
            {/* Hero (軽量): 比較対象 + カテゴリ名 (noindex のため軽量に) */}
            <header className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    地域間比較
                </p>
                <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                    {regions ? (
                        <>
                            {regions[0].areaName}
                            <span className="mx-2 text-muted-foreground">vs</span>
                            {regions[1].areaName}
                        </>
                    ) : (
                        "都道府県を比較"
                    )}
                    {currentCategory && (
                        <span className="ml-3 align-middle text-xs font-medium text-muted-foreground">
                            {currentCategory.categoryName}
                        </span>
                    )}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    2 つの都道府県の{currentCategory?.categoryName ?? "統計データ"}を、KPI とチャートで横並びに比較できます。
                </p>
            </header>

            <RegionComparisonClient
                regions={regions}
                categories={categories}
                currentCategoryKey={categoryKey}
                selectedAreaCodes={areaCodes}
                choroplethMapData={choroplethMapData}
            >
                {regions && pageComponents.length > 0 && (
                    <CompareGridLayout regions={regions} components={pageComponents} />
                )}
            </RegionComparisonClient>
            <AdSenseAd
                format={COMPARE_PAGE_SIDEBAR.format}
                slotId={COMPARE_PAGE_SIDEBAR.slotId}
                className="mt-6"
            />
        </PageShell>
    );
}
