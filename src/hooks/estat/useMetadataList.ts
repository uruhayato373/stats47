"use client";

import { useState, useEffect } from "react";
import type { SavedEstatMetainfoItem } from "@/types/models";

export function useMetadataList() {
  const [data, setData] = useState<SavedEstatMetainfoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/estat/metainfo/stats-list?limit=100");
      if (!response.ok) {
        throw new Error(`データの取得に失敗しました: ${response.status}`);
      }
      const responseData = await response.json();

      // stats-list APIは { items: [...], pagination: {...}, meta: {...} } 形式で返す
      if (responseData && Array.isArray(responseData.items)) {
        setData(responseData.items);
      } else {
        throw new Error("予期しないデータ形式");
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
    if (!confirm("このメタ情報を削除しますか？")) return;

    try {
      // 削除機能は現在実装されていません
      // 必要に応じて stats-list エンドポイント経由で実装予定
      console.warn("削除機能は現在利用できません");
      setError("削除機能は現在利用できません");
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
