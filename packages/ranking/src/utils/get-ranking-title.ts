import type { RankingItem } from "../types/ranking-item";

/**
 * ランキング項目から適切な表示用タイトルを解決する
 *
 * 優先順位:
 * 1. title (表示用タイトル)
 * 2. rankingName (正式名称)
 *
 * @param item - RankingItem オブジェクト
 * @returns 解決されたタイトル
 */
export function getRankingTitle(item: Pick<RankingItem, "title" | "rankingName">): string {
  return item.title || item.rankingName;
}
