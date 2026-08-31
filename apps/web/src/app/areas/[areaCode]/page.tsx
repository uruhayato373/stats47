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

import {
    BannerAd,
    FooterAdSlot,
    InContentAdSlot,
    isLandscapeBanner,
} from "@/features/ads";
import {
    AreaBannerAd,
    resolveAffiliateBannersByVertical,
} from "@/features/ads/server";
import { AreaDatabookSection } from "@/features/area-databook";
import {
    AreaProfilePageClient,
    AreaProfileSidebar,
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
import { AreaGeoInsightsSection } from "@/features/geo-analysis";

import {
    ADSENSE_DISPLAY_ENABLED,
    HUB_INCONTENT,
} from "@/lib/google-adsense";

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
    const [profile, categoriesResult, areaContentBanners] = await Promise.all([
        getAreaProfileAction(areaCode),
        listCategories(),
        resolveAffiliateBannersByVertical("furusato", 8).catch(() => []),
    ]);

    if (!profile) {
        notFound();
    }

    const categories = isOk(categoriesResult) ? categoriesResult.data : [];
    const areaContentBanner = areaContentBanners.find(isLandscapeBanner) ?? null;

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
                        topWidgets={
                            <AreaProfileSidebar
                                strengths={profile.strengths}
                                weaknesses={profile.weaknesses}
                            />
                        }
                        // ★ 2026-07-28: locationCode "area-sidebar" の在庫は市区町村ページの
                        //   フッターにしか描画されておらず、枠名と実際の描画位置が食い違っていた。
                        //   県ページ (6,723 imp) のレール下部にも出す。
                        bottomWidgets={<AreaBannerAd />}
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
                    {/* 県データブック (値+全国順位 + 特産品 + 推移チャート)。
                        databook 未生成の県は従来チャート表示にフォールバックする。 */}
                    <AreaDatabookSection
                        areaCode={areaCode}
                        areaName={profile.areaName}
                    />

                    <AreaGeoInsightsSection
                        areaCode={areaCode}
                        areaName={profile.areaName}
                    />

                    {/* チャート読了後。AdSense停止中は地域意図に合うバナーだけを表示する。 */}
                    {ADSENSE_DISPLAY_ENABLED && (
                        <InContentAdSlot slot={HUB_INCONTENT} />
                    )}
                    {!ADSENSE_DISPLAY_ENABLED && areaContentBanner && (
                        <div className="flex justify-center">
                            <BannerAd
                                href={areaContentBanner.href}
                                imageUrl={areaContentBanner.imageUrl}
                                trackingPixelUrl={areaContentBanner.trackingPixelUrl}
                                width={areaContentBanner.width}
                                height={areaContentBanner.height}
                                category={areaContentBanner.vertical ?? "furusato"}
                                label={areaContentBanner.title}
                                position="area-content"
                                adId={areaContentBanner.id}
                                creativeSize={`${areaContentBanner.width}x${areaContentBanner.height}`}
                            />
                        </div>
                    )}

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

                    {/*
                      広告②: 本文末尾。RailAdSlot は右レール(360px)前提の SurfaceCard 枠で、
                      本文カラム(840px)に置くと枠だけレール幅のまま浮く。他のハブ面と同じ
                      本文末尾の Multiplex に揃える (2026-07-29 是正)。RAIL_RECT は
                      home の左レールが引き続き使う。
                    */}
                    <FooterAdSlot />
                </main>
            </PageShell>
        </>
    );
}
