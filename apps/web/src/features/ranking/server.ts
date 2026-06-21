import "server-only";

import { readFeaturedRankingItemsFromR2 } from "@stats47/ranking/server";
import { err, type Result } from "@stats47/types";

import type { RankingItem } from "@stats47/ranking";

export { cachedFindRankingItem } from "./lib/cached-ranking-item";

/**
 * おすすめランキングを取得する
 *
 * @param limit 取得件数
 */
export async function getFeaturedRankings(limit: number = 20): Promise<Result<RankingItem[], Error>> {
  try {
    return await readFeaturedRankingItemsFromR2(limit);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

// サーバーコンポーネントの再エクスポート
export { FeaturedRankings } from "./components/FeaturedRankings";
export { CorrelationSectionContainer } from "./components/CorrelationSection";
export { RankingItemsSidebar } from "./components/RankingSidebar";
export { RelatedRankingsGrid } from "./components/RelatedRankingsGrid/RelatedRankingsGrid";
export { RankingPageCardsContainer } from "./components/RankingPageCards";
export { RelatedArticlesCard } from "./components/RankingSidebar/RelatedArticlesCard";
export * from "./components/RankingKeyPage/server";

// Server components (sidebar cards)
export { PortStatisticsMapCard } from "./components/RankingSidebar/PortStatisticsMapCard";

// Cached category items reader (R2) — server-only を server entry に閉じ込め、app/ から index 経由でなく server から参照させる
export { readRankingItemsByCategory } from "./lib/cached-category-items";

export { loadRankingPageModel } from "./services/load-ranking-page-model";
export { getRankingPageMetadata, getRankingStaticParams } from "./services/ranking-page-route";
