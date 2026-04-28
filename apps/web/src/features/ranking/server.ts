import "server-only";

import { cache } from "react";

import {
  readFeaturedRankingItemsFromR2,
  readRankingItemFromR2,
} from "@stats47/ranking/server";
import { err, type Result } from "@stats47/types";

import type { RankingItem } from "@stats47/ranking";

// cache() でリクエストレベル dedupe（generateMetadata + ページ本体の重複排除）。
// R2 snapshot 経由なので D1 read は発生しない。reader 内部にも module-level cache あり。
export const cachedFindRankingItem = cache(readRankingItemFromR2);

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
export { RankingPageCardsContainer } from "./components/RankingPageCards";
export { SurveyBadge } from "./components/SurveyBadge/SurveyBadge";
export { RelatedArticlesCard } from "./components/RankingSidebar/RelatedArticlesCard";
export { RelatedGroupCard } from "./components/RankingSidebar/RelatedGroupCard";

// サーバー専用ローダー
export { loadRankingTopPageData } from "./lib/ranking-top-page-loader";
export type { RankingTopPageData, FeaturedRankingItemView } from "./lib/ranking-top-page-loader";

// Server components (sidebar cards)
export { PortStatisticsMapCard } from "./components/RankingSidebar/PortStatisticsMapCard";
