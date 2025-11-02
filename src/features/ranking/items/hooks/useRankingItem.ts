"use client";

/**
 * ランキング項目情報取得カスタムフック
 * ランキング項目の取得とエラーハンドリングを担当
 */

import { useEffect, useState } from "react";

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
        // API経由でランキング項目を取得
        const response = await fetch(
          `/api/rankings/item/${encodeURIComponent(rankingKey)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setRankingItem(data);
        setError(!data ? "ランキング項目が見つかりません" : null);
      } catch (err) {
        console.error("Failed to fetch ranking item:", err);
        setError(
          err instanceof Error
            ? err.message
            : "ランキング項目の取得に失敗しました"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchRankingItem();
  }, [rankingKey]);

  return {
    rankingItem,
    isLoading,
    error,
  };
}

