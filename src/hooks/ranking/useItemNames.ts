"use client";

import { useState } from "react";

export function useItemNames() {
  const [itemNames, setItemNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItemNames = async (statsDataId: string) => {
    setLoading(true);
    try {
      // stats-listエンドポイントを使用して統計表の詳細情報を取得
      const response = await fetch(
        `/api/estat/metainfo/saved?search=${statsDataId}&limit=1`
      );
      if (response.ok) {
        const data = await response.json();
        // 統計表が見つかった場合、その統計表の項目数を取得
        if (data.items && data.items.length > 0) {
          const statsInfo = data.items[0];
          // 項目名の代わりに統計表の基本情報を使用
          setItemNames([statsInfo.title || statsInfo.stat_name || statsDataId]);
        } else {
          setItemNames([]);
        }
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error(
          "Failed to fetch stats info:",
          response.status,
          errorData
        );
        setItemNames([]);
      }
    } catch (error) {
      console.error("Failed to fetch stats info:", error);
      setItemNames([]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setItemNames([]);
  };

  return {
    itemNames,
    loading,
    fetchItemNames,
    reset,
  };
}
