"use client";

import { useState, useEffect } from "react";
import MetadataActions from "./MetadataActions";

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
      setMetadata([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600 dark:text-neutral-400">
            データを読み込み中...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-700">
        <p className="text-red-800 dark:text-red-200">エラー: {error}</p>
        <MetadataActions
          onRefresh={fetchSavedMetadata}
          onRetry={fetchSavedMetadata}
          hasError={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
            保存済みデータ一覧
          </h4>
          <MetadataActions onRefresh={fetchSavedMetadata} />
        </div>
        <div className="text-sm text-gray-800 dark:text-neutral-200 font-medium">
          {metadata.length}件のデータ
        </div>
      </div>

      {/* データテーブル */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
        {metadata.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-neutral-400">
            保存されたデータがありません。
            <br />
            メタ情報保存タブでデータを保存してください。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg dark:border-neutral-600">
              <thead className="bg-gray-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 border-r border-gray-200 dark:border-neutral-600">
                    統計表ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 border-r border-gray-200 dark:border-neutral-600">
                    統計名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300">
                    タイトル
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300">
                    カテゴリ数
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-600">
                {metadata.map((item, index) => (
                  <tr
                    key={`${item.stats_data_id}-${index}`}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-700"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-neutral-100 border-r border-gray-200 dark:border-neutral-600">
                      {item.stats_data_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-100 border-r border-gray-200 dark:border-neutral-600">
                      {item.stat_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-100">
                      <div className="max-w-md truncate" title={item.title}>
                        {item.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-100">
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
