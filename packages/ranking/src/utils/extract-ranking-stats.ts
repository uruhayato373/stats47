import type { RankingItemCounts } from "../types";

/**
 * 地域タイプに基づいて統計情報を抽出する
 *
 * @param allStats - すべての地域タイプの統計情報の配列
 * @param areaType - 抽出対象の地域タイプ（例: 'prefecture', 'city'）
 * @returns 指定された地域タイプの統計情報、または見つからない場合は undefined
 */
export function extractRankingStatsByAreaType(
  allStats: RankingItemCounts[],
  areaType: string
): RankingItemCounts | undefined {
  return allStats.find((s) => s.areaType === areaType);
}
