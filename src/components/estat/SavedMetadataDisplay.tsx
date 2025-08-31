"use client";

import { useState, useEffect } from "react";
import { useStyles } from "@/hooks/useStyles";

interface SavedMetadata {
  stats_data_id: string;
  stat_name: string;
  title: string;
  category_count: number;
}

export default function SavedMetadataDisplay() {
  const [metadata, setMetadata] = useState<SavedMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const styles = useStyles();

  useEffect(() => {
    fetchSavedMetadata();
  }, []);

  const fetchSavedMetadata = async () => {
    try {
      setLoading(true);
      setError("");

      // Cloudflare D1からデータを取得
      const response = await fetch("/api/estat/metadata/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`データの取得に失敗しました: ${response.status}`);
      }

      const data = await response.json();

      // データが配列であることを確認
      if (Array.isArray(data)) {
        setMetadata(data);
      } else if (data && typeof data === "object" && "error" in data) {
        throw new Error(String(data.error));
      } else {
        console.warn("予期しないデータ形式:", data);
        setMetadata([]);
      }
    } catch (err) {
      console.error("データ取得エラー:", err);
      setError(
        err instanceof Error ? err.message : "データの取得に失敗しました"
      );
      setMetadata([]); // エラー時は空配列を設定
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">データを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.message.error}>
        <p className={styles.text.body}>エラー: {error}</p>
        <button
          onClick={fetchSavedMetadata}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className={styles.layout.section}>
      {/* ヘッダー */}
      <div className={styles.card.base}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            保存済みデータ一覧
          </h4>
          <button
            onClick={fetchSavedMetadata}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            更新
          </button>
        </div>
        <div className="text-sm text-gray-800 font-medium">
          {metadata.length}件のデータ
        </div>
      </div>

      {/* データテーブル */}
      <div className={styles.card.base}>
        {metadata.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            保存されたデータがありません。
            <br />
            メタ情報保存タブでデータを保存してください。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                    統計表ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                    統計名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                    タイトル
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                    カテゴリ数
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {metadata.map((item, index) => (
                  <tr
                    key={`${item.stats_data_id}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 border-r border-gray-200">
                      {item.stats_data_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                      {item.stat_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="max-w-md truncate" title={item.title}>
                        {item.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.category_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
