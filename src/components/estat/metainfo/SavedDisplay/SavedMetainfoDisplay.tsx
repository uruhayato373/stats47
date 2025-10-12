"use client";

import { useState, useEffect } from "react";
import { useStyles } from "@/hooks/useStyles";
import EstatMetainfoActions from "../Actions";

interface SavedMetainfo {
  stats_data_id: string;
  stat_name: string;
  title: string;
  category_count: number;
}

export default function SavedEstatMetainfoDisplay() {
  const [metadata, setMetadata] = useState<SavedMetainfo[]>([]);
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
      const response = await fetch("/api/estat/metainfo/stats", {
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
      <div className={styles.card.base}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className={`ml-2 ${styles.text.tertiary}`}>
            データを読み込み中...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.message.error}>
        <p className={styles.messageText.error}>エラー: {error}</p>
        <EstatMetainfoActions
          onRefresh={fetchSavedMetadata}
          onRetry={fetchSavedMetadata}
          hasError={true}
        />
      </div>
    );
  }

  return (
    <div className={styles.layout.section}>
      {/* ヘッダー */}
      <div className={styles.card.base}>
        <div className="flex items-center justify-between mb-4">
          <h4 className={styles.heading.lg}>保存済みデータ一覧</h4>
          <EstatMetainfoActions onRefresh={fetchSavedMetadata} />
        </div>
        <div className={`text-sm ${styles.text.secondary} font-medium`}>
          {metadata.length}件のデータ
        </div>
      </div>

      {/* データテーブル */}
      <div className={styles.card.base}>
        {metadata.length === 0 ? (
          <div className={`text-center py-8 ${styles.text.muted}`}>
            保存されたデータがありません。
            <br />
            メタ情報保存タブでデータを保存してください。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg dark:border-neutral-600">
              <thead className="bg-gray-50 dark:bg-neutral-700">
                <tr>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium ${styles.text.tertiary} border-r border-gray-200 dark:border-neutral-600`}
                  >
                    統計表ID
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium ${styles.text.tertiary} border-r border-gray-200 dark:border-neutral-600`}
                  >
                    統計名
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium ${styles.text.tertiary}`}
                  >
                    タイトル
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium ${styles.text.tertiary}`}
                  >
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
                    <td
                      className={`px-4 py-3 text-sm font-mono ${styles.text.primary} border-r border-gray-200 dark:border-neutral-600`}
                    >
                      {item.stats_data_id}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm ${styles.text.primary} border-r border-gray-200 dark:border-neutral-600`}
                    >
                      {item.stat_name}
                    </td>
                    <td className={`px-4 py-3 text-sm ${styles.text.primary}`}>
                      <div className="max-w-md truncate" title={item.title}>
                        {item.title}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${styles.text.primary}`}>
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
