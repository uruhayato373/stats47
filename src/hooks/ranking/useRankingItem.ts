/**
 * ランキング項目情報取得カスタムフック
 * ランキング項目の取得とエラーハンドリングを担当
 */

import type { RankingItem } from "@/data/mock/ranking-items";
import { getRankingItemByKey } from "@/data/mock/ranking-items";

interface UseRankingItemReturn {
  rankingItem: RankingItem | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * ランキング項目情報を取得するカスタムフック
 * @param rankingKey ランキングキー
 * @returns ランキング項目情報、ローディング状態、エラー状態
 */
export function useRankingItem(rankingKey: string): UseRankingItemReturn {
  // 現在は同期的なデータ取得だが、将来的にAPI対応時は非同期化
  const rankingItem = getRankingItemByKey(rankingKey);

  return {
    rankingItem,
    isLoading: false, // 現在は同期的なため常にfalse
    error: !rankingItem ? "ランキング項目が見つかりません" : null,
  };
}
