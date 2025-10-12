"use client";

import { useState, useEffect } from "react";

interface SavedMetaInfo {
  stats_data_id: string;
  stat_name: string;
  title: string;
  category_count: number;
}

export function useSavedMetaInfo() {
  const [data, setData] = useState<SavedMetaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Cloudflare D1からデータを取得
      const response = await fetch("/api/estat/metainfo/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`データの取得に失敗しました: ${response.status}`);
      }

      const responseData = await response.json();

      // データが配列であることを確認
      if (Array.isArray(responseData)) {
        setData(responseData);
      } else if (
        responseData &&
        typeof responseData === "object" &&
        "error" in responseData
      ) {
        throw new Error(String(responseData.error));
      } else {
        console.warn("予期しないデータ形式:", responseData);
        setData([]);
      }
    } catch (err) {
      console.error("データ取得エラー:", err);
      setError(
        err instanceof Error ? err.message : "データの取得に失敗しました"
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/estat/metainfo/saved/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setData((prev) => prev.filter((item) => item.stats_data_id !== id));
      } else {
        throw new Error("削除に失敗しました");
      }
    } catch (err) {
      console.error("削除エラー:", err);
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, fetchData, deleteItem };
}
