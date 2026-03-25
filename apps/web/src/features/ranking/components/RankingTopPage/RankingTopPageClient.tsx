"use client";

import { CategoryGrid, type CategoryGridItem } from "@/features/category";

import { FeaturedRankingCard } from "../FeaturedRankingCard";

/**
 * Featuredアイテムの型
 */
interface FeaturedRankingItem {
    rankingKey: string;
    areaType: string;
    title: string;
    subtitle?: string | null;
    latestYear?: string;
    unit: string;
    demographicAttr?: string | null;
    normalizationBasis?: string | null;
    definition?: string | null;
    baseThumbnailUrl: string;
}

interface RankingTopPageClientProps {
    /** おすすめランキングアイテム */
    featuredItems: FeaturedRankingItem[];
    /** カテゴリ一覧 */
    categories: CategoryGridItem[];
}

/**
 * ランキングトップページのプレゼンテーションコンポーネント
 */
export function RankingTopPageClient({
    featuredItems,
    categories,
}: RankingTopPageClientProps) {
    return (
        <div className="container mx-auto px-4 py-6 text-foreground">
            <div className="mb-6">
                <h1 className="text-lg font-bold mb-1">ランキング一覧</h1>
                <p className="text-sm text-muted-foreground">
                    都道府県の統計データをランキング形式で比較できます
                </p>
            </div>

            {/* おすすめランキングセクション */}
            <section className="mb-12">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <span className="text-amber-500">★</span>
                    <span>注目・おすすめのランキング</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {featuredItems.map((item) => (
                        <FeaturedRankingCard
                            key={`${item.rankingKey}-${item.areaType}`}
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

            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                カテゴリから探す
            </h2>

            <CategoryGrid categories={categories} />
        </div>
    );
}
