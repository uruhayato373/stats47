"use client";

import { useStyles } from "@/hooks/useStyles";
import EstatMetaInfoActions from "../Actions";
import { useSavedMetaInfo } from "./hooks";

export default function SavedEstatMetaInfoDisplay() {
  const styles = useStyles();
  const {
    data: metadata,
    loading,
    error,
    fetchData,
    deleteItem,
  } = useSavedMetaInfo();

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
        <EstatMetaInfoActions
          onRefresh={fetchData}
          onRetry={fetchData}
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
          <EstatMetaInfoActions onRefresh={fetchData} />
        </div>
        <div className={`text-sm ${styles.text.secondary} font-medium`}>
          {metadata.length}件のデータ
        </div>
      </div>

      {/* データテーブル */}
      <div className={styles.card.base}>
        {metadata.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-neutral-500 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className={`${styles.text.secondary}`}>
              保存済みデータがありません
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    統計表ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    政府統計名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    統計表題名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    カテゴリ数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
                {metadata.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-neutral-100">
                      {item.stats_data_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                      {item.stat_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                      {item.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                      {item.category_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteItem(item.stats_data_id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        削除
                      </button>
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
