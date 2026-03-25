/**
 * カテゴリページ（Server Component）
 *
 * `/category/{categoryKey}` でアクセスされ、
 * 注目ランキング（コンパクトカード）+ 全件テーブルのハイブリッドレイアウト。
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Suspense } from "react";
import { isOk } from "@stats47/types";
import { findRankingItemsByCategory, listSurveys } from "@stats47/ranking/server";

import { findCategoryByKey } from "@/features/category/server";
import { listLatestArticles } from "@/features/blog/server";
import {
  FeaturedRankingCard,
  CategoryRankingTable,
  type CategoryRankingListItem,
} from "@/features/ranking";
import { generateOGMetadata } from "@/lib/metadata/og-generator";
import { AdSenseAd, RANKING_PAGE_FOOTER } from "@/lib/google-adsense";
import { SurveyCard } from "@/features/ranking/components/RankingSidebar/SurveyCard";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ categoryKey: string }>;
}

/** latestYear JSON から yearCode を抽出 */
function parseLatestYear(latestYear: unknown): string {
  try {
    const parsed = typeof latestYear === "string"
      ? JSON.parse(latestYear)
      : latestYear;
    if (parsed?.yearCode) return parsed.yearCode;
  } catch { /* fallback */ }
  return "2024";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoryKey } = await params;

  try {
    const catResult = await findCategoryByKey(categoryKey);
    const category = isOk(catResult) ? catResult.data : null;

    if (!category) {
      return { title: "ページが見つかりません" };
    }

    const title = `${category.categoryName} | 統計で見る都道府県`;
    const description = `${category.categoryName}に関する都道府県別ランキング一覧。47都道府県を統計データで比較できます。`;

    return {
      title,
      description,
      alternates: {
        canonical: `/category/${categoryKey}`,
      },
      ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
    };
  } catch {
    return { title: "ランキング一覧" };
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { categoryKey } = await params;

  const catResult = await findCategoryByKey(categoryKey);
  const category = isOk(catResult) ? catResult.data : null;

  if (!category) {
    notFound();
  }

  const [rankingResult, latestArticles, surveysResult] = await Promise.all([
    findRankingItemsByCategory(categoryKey),
    listLatestArticles(4).catch(() => []),
    listSurveys().then((r) => isOk(r) ? r.data : []).catch(() => []),
  ]);
  const rankingItems = isOk(rankingResult) ? rankingResult.data : [];

  const r2PublicUrl =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    "https://storage.stats47.jp";

  // テーブル用データ
  const allItems: CategoryRankingListItem[] = rankingItems.map((item) => {
    const latestYear = parseLatestYear(item.latestYear);
    return {
      rankingKey: item.rankingKey,
      areaType: item.areaType,
      title: item.subtitle ? `${item.title} (${item.subtitle})` : item.title,
      subtitle: item.subtitle,
      latestYear,
      unit: item.unit,
      description: item.description,
      demographicAttr: item.demographicAttr,
      normalizationBasis: item.normalizationBasis,
    };
  });

  // 注目ランキング（カード用にサムネイルURL付き、rankingKey で重複排除）
  const seenKeys = new Set<string>();
  const featuredItems = rankingItems
    .filter((item) => {
      if (!item.isFeatured) return false;
      if (seenKeys.has(item.rankingKey)) return false;
      seenKeys.add(item.rankingKey);
      return true;
    })
    .map((item) => {
      const latestYear = parseLatestYear(item.latestYear);
      return {
        rankingKey: item.rankingKey,
        title: item.subtitle ? `${item.title} (${item.subtitle})` : item.title,
        latestYear,
        unit: item.unit,
        demographicAttr: item.demographicAttr,
        normalizationBasis: item.normalizationBasis,
        baseThumbnailUrl: `${r2PublicUrl}/ranking/prefecture/${item.rankingKey}/${latestYear}/thumbnails/thumbnail`,
      };
    });

  const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

  return (
    <div className="container mx-auto px-4 py-4 text-foreground">
      <h1 className="text-lg font-bold">
        {category.categoryName}
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          {rankingItems.length}件
        </span>
      </h1>

      <div className="flex gap-4 mt-4 items-start">
        {/* メインコンテンツ */}
        <main className="flex-1 min-w-0">
          {rankingItems.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-lg">
                該当するランキングが見つかりませんでした。
              </p>
            </div>
          ) : (
            <>
              {/* 注目ランキング（コンパクトカード） */}
              {featuredItems.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">注目のランキング</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {featuredItems.map((item) => (
                      <FeaturedRankingCard
                        key={item.rankingKey}
                        rankingKey={item.rankingKey}
                        title={item.title}
                        baseThumbnailUrl={item.baseThumbnailUrl}
                        latestYear={item.latestYear}
                        unit={item.unit}
                        demographicAttr={item.demographicAttr}
                        normalizationBasis={item.normalizationBasis}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 全件テーブル */}
              <CategoryRankingTable items={allItems} />
            </>
          )}
        </main>

        {/* 右サイドバー（lg以上） */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-20">
          <div className="flex flex-col gap-4">
            {/* 新着記事 */}
            {latestArticles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">新着記事</h3>
                <div className="flex flex-col gap-2">
                  {latestArticles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/blog/${article.slug}`}
                      className="group block rounded-sm border border-border overflow-hidden hover:border-primary/50 transition-colors"
                    >
                      <div className="relative aspect-[1200/630] w-full bg-muted">
                        <Image
                          src={`${r2Url}/blog/${article.slug}/thumbnail-light.webp`}
                          alt={article.title}
                          fill
                          sizes="256px"
                          className="object-cover dark:hidden"
                          loading="lazy"
                        />
                        <Image
                          src={`${r2Url}/blog/${article.slug}/thumbnail-dark.webp`}
                          alt={article.title}
                          fill
                          sizes="256px"
                          className="object-cover hidden dark:block"
                          loading="lazy"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 広告 */}
            <AdSenseAd
              format={RANKING_PAGE_FOOTER.format}
              slotId={RANKING_PAGE_FOOTER.slotId}
            />

            {/* 調査から探す */}
            <SurveyCard surveys={surveysResult.map(s => ({ id: s.id, name: s.name }))} />
          </div>
        </aside>
      </div>
    </div>
  );
}
