import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchPrefectures } from "@stats47/area";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import { isOk } from "@stats47/types";

import { SetSidebarSection } from "@/components/molecules/SetSidebarSection";

import { FurusatoNozeiCard } from "@/features/ads";
import { AreaBannerAd } from "@/features/ads/server";
import {
    AreaProfilePageClient,
    AreaProfileSidebar,
    AreaChartSection,
    AreaRelatedRankingsCard,
    CitiesNavCard,
    RelatedAreas,
    CategoryNavGrid,
    generateAreaMetadata,
    generateAreaProfileBreadcrumbStructuredData,
    generateAreaProfileStructuredData,
} from "@/features/area-profile";
import { getAreaProfileAction } from "@/features/area-profile/server";
import { listCategories } from "@/features/category/server";
import { RightRailWidgets } from "@/features/redesign";


import { AdSenseAd, RANKING_SIDEBAR_TOP } from "@/lib/google-adsense";


import type { Metadata } from "next";


/** ビルド時に全47都道府県を事前生成 */
export function generateStaticParams() {
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

            {/* 左サイドバーに強み・弱みを注入 (サイドバー開いたとき用) */}
            <SetSidebarSection>
                <AreaProfileSidebar
                    strengths={profile.strengths}
                    weaknesses={profile.weaknesses}
                />
            </SetSidebarSection>

            {/* 2 カラムレイアウト (xl+ で右サイドバー、xl 未満は main のみ) */}
            <div className="container mx-auto px-4 py-10">
                <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-5 xl:items-start">
                    <main className="min-w-0 space-y-10">
                    {/* DB管理チャート */}
                    <AreaChartSection
                        areaCode={areaCode}
                        areaName={profile.areaName}
                    />

                    {/* 広告①: チャート読了後 */}
                    <AdSenseAd
                        format={RANKING_SIDEBAR_TOP.format}
                        slotId={RANKING_SIDEBAR_TOP.slotId}
                    />

                    {/* カテゴリナビゲーション */}
                    <CategoryNavGrid
                        categories={categories}
                        areaCode={areaCode}
                    />

                    {/* この県のトップ/ボトムランキング (ranking 詳細への内部リンク強化) */}
                    <AreaRelatedRankingsCard profile={profile} limit={6} />

                    {/* 関連エリア */}
                    <RelatedAreas areaCode={areaCode} />

                    {/* 市区町村ナビ (サイドバー閉じてもメインで見える) */}
                    <CitiesNavCard areaCode={areaCode} areaName={profile.areaName} />

                    {/* 広告②: アフィリエイト直前 */}
                    <AdSenseAd
                        format={RANKING_SIDEBAR_TOP.format}
                        slotId={RANKING_SIDEBAR_TOP.slotId}
                    />

                    {/* アフィリエイト (xl 未満では main 内に表示) */}
                    <div className="xl:hidden space-y-6">
                        <AreaBannerAd />
                        <FurusatoNozeiCard areaCode={areaCode} />
                    </div>
                </main>

                    {/* 右サイドバー (xl+) — その県のふるさと納税 + Claude Code 講座 + 関連 AdSense */}
                    <aside className="hidden xl:block">
                        <RightRailWidgets furusatoAreaCode={areaCode} />
                    </aside>
                </div>
            </div>
        </>
    );
}
