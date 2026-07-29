import "server-only";

import { readFeaturedRankingItemsFromR2 } from "@stats47/ranking/server";
import { err, type Result } from "@stats47/types";

import type { FeaturedRankingItem } from "@stats47/ranking";

/**
 * おすすめランキングを取得する
 *
 * `../server` (barrel) ではなくここに置く。FeaturedRankings が barrel を経由すると、
 * ランキング詳細ページ一式と METRICS_REGISTRY が home の bundle に入る。
 *
 * @param limit 取得件数
 */
export async function getFeaturedRankings(
  limit: number = 20,
): Promise<Result<FeaturedRankingItem[], Error>> {
  try {
    return await readFeaturedRankingItemsFromR2(limit);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
