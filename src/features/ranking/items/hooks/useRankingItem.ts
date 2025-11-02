"use client";

/**
 * ランキング項目情報取得カスタムフック
 * ランキング項目の取得とエラーハンドリングを担当
 */

import { useEffect, useState } from "react";

import { getRankingItem } from "../actions/getRankingItem";

import type { RankingItem } from "../types";

export interface UseRankingItemReturn {
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
  const [rankingItem, setRankingItem] = useState<RankingItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRankingItem() {
      try {
        setIsLoading(true);
        // Server Action経由でランキング項目を取得
        const data = await getRankingItem(rankingKey);

        if (!data) {
          setError("ランキング項目が見つかりません");
          setRankingItem(null);
        } else {
          setRankingItem(data);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch ranking item:", err);
        setError(
          err instanceof Error
            ? err.message
            : "ランキング項目の取得に失敗しました"
        );
        setRankingItem(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (rankingKey) {
      fetchRankingItem();
    }
  }, [rankingKey]);

  return {
    rankingItem,
    isLoading,
    error,
  };
}
