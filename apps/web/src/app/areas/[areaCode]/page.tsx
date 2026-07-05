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

import { PageShell } from "@/components/layout";
import { RightRailWidgets } from "@/components/rail";

import { InContentAdSlot, RailAdSlot } from "@/features/ads";
import {
    AreaProfilePageClient,
    AreaProfileSidebar,
    AreaChartSection,
    AreaRelatedRankingsCard,
    AreaRelatedBlogArticles,
    CitiesNavCard,
    RelatedAreas,
    CategoryNavGrid,
    generateAreaMetadata,
    generateAreaProfileBreadcrumbStructuredData,
    generateAreaProfileStructuredData,
} from "@/features/area-profile";
import { getAreaProfileAction } from "@/features/area-profile/server";
import { listCategories } from "@/features/category/server";


import { HUB_INCONTENT, RAIL_RECT } from "@/lib/google-adsense";


import type { Metadata } from "next";


/**
 * オンデマンド ISR（24時間）。
 *
 * generateStaticParams は付けない。付けると 47 県が `●` SSG 化され、ビルド時に R2 から
 * area profile を読めず notFound として prerender される。この OpenNext 構成では ISR 再生成が
 * 効かず「地域の特徴が見つかりません」が永久固着する（2026-06-22 障害）。generateStaticParams
 * なし = `ƒ`（オンデマンド）でランタイムに R2 を読んで描画する（ranking / areas/[themeSlug] と同方式）。
 * 詳細: .claude/rules/nextjs-ssg-preservation.md
 */
export const revalidate = 86400;

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
            alternates: { canonical: "/areas" },
        };
    }

    // title / description 差別化（#77 Phase 4）
    // 47 都道府県全てで同一テンプレートだった title を「県の top 強み指標」で差別化。
    // 例: "東京都の統計データ" → "東京都の統計データ｜卸売業年間商品販売額 全国1位 | 47都道府県比較"
    // rank=0 はデータ欠損 (未ランク) のため除外。R2 snapshot に rank=0 が含まれている場合の defense in depth。
    const validStrengths = profile.strengths.filter((s) => s.rank >= 1 && s.rank <= 47);
    const topStrength = validStrengths[0];
    const title = topStrength
      ? `${profile.areaName}の統計データ｜${topStrength.indicator} 全国${topStrength.rank}位｜47都道府県比較`
      : `${profile.areaName}の統計データ｜47都道府県比較`;
    const descriptionHighlights = validStrengths
      .slice(0, 3)
      .map((s) => `${s.indicator} 全国${s.rank}位`)
      .join("、");
    const description = descriptionHighlights
      ? `${profile.areaName}の統計プロファイル。${descriptionHighlights}。人口・経済・教育など17カテゴリのデータを全国ランキングで比較。`
      : `${profile.areaName}の特徴を統計データから分析。人口・経済・教育など17カテゴリのデータを全国ランキングで比較。`;

    return generateAreaMetadata({ title, description, areaCode });
}

export default async function AreaProfilePage({ params }: PageProps) {
    const { areaCode } = await params;
    // profile と categories は独立 (互いに依存しない) ため並列取得する。
    const [profile, categoriesResult] = await Promise.all([
        getAreaProfileAction(areaCode),
        listCategories(),
    ]);

    if (!profile) {
        notFound();
    }

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

            <PageShell
                rightRail={
                    <RightRailWidgets
                        furusatoAreaCode={areaCode}
                        topWidgets={
                            <AreaProfileSidebar
                                strengths={profile.strengths}
                                weaknesses={profile.weaknesses}
                            />
                        }
                    />
                }
            >
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
                            <BreadcrumbPage>{profile.areaName}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* ヘッダー */}
                <AreaProfilePageClient profile={profile} />

                <main className="min-w-0 space-y-10">
                    {/* DB管理チャート */}
                    <AreaChartSection
                        areaCode={areaCode}
                        areaName={profile.areaName}
                    />

                    {/* 広告①: チャート読了後（記事内・fluid。slotId 未発行の間は非表示） */}
                    <InContentAdSlot slot={HUB_INCONTENT} />

                    {/* カテゴリナビゲーション */}
                    <CategoryNavGrid
                        categories={categories}
                        areaCode={areaCode}
                    />

                    {/* この県のトップ/ボトムランキング (ranking 詳細への内部リンク強化) */}
                    <AreaRelatedRankingsCard profile={profile} limit={6} />

                    {/* 関連ブログ記事 (P0-AREAS-01 内部リンク強化) */}
                    <AreaRelatedBlogArticles profile={profile} limit={5} />

                    {/* 関連エリア */}
                    <RelatedAreas areaCode={areaCode} />

                    {/* 市区町村ナビ (サイドバー閉じてもメインで見える) */}
                    <CitiesNavCard areaCode={areaCode} areaName={profile.areaName} />

                    {/* 広告②: アフィリエイト直前（独立スロットの rect で同一 slot 重複を解消） */}
                    <RailAdSlot slot={RAIL_RECT} />
                </main>
            </PageShell>
        </>
    );
}
