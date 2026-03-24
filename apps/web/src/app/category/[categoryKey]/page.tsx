/**
 * カテゴリページ（Server Component）
 *
 * `/category/{categoryKey}` でアクセスされ、
 * 注目ランキング（コンパクトカード）+ 全件テーブルのハイブリッドレイアウト。
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { isOk } from "@stats47/types";
import { findRankingItemsByCategory } from "@stats47/ranking/server";

import { findCategoryByKey } from "@/features/category/server";
import {
  FeaturedRankingCard,
  CategoryRankingTable,
  type CategoryRankingListItem,
} from "@/features/ranking";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

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

  const rankingResult = await findRankingItemsByCategory(categoryKey);
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

  return (
    <div className="container mx-auto px-4 py-6 text-foreground">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">
          {category.categoryName} のランキング一覧
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {rankingItems.length}件
          </span>
        </h1>
      </div>

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
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-primary/10 p-1.5 rounded-lg text-primary text-sm">⭐</span>
                注目のランキング
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
    </div>
  );
}
