"use client";

import { useState, useEffect } from "react";

interface EstatTransformedData {
  id: number;
  stats_data_id: string;
  stat_name: string;
  title: string;
  cat01: string | null;
  item_name: string | null;
  unit: string | null;
  created_at: string;
  updated_at: string;
}

interface StatsData {
  totalCount: number;
  statCount: number;
  categories: Array<{
    stats_data_id: string;
    stat_name: string;
    title: string;
  }>;
}

export default function SavedMetadataDisplay() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EstatTransformedData[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 統計情報を取得
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/estat/metadata/stats");
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("統計情報の取得に失敗しました");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/estat/metadata/search?q=${encodeURIComponent(searchQuery)}`
      );
      const result = await response.json();

      if (result.success) {
        setSearchResults(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("検索に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* 統計情報 */}
      {stats && (
        <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 dark:bg-neutral-800 dark:border-neutral-700">
          <h3 className="text-lg font-medium text-gray-800 mb-3 dark:text-neutral-200">
            保存済みデータ統計
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.totalCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-neutral-400">
                総データ件数
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.statCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-neutral-400">
                統計表数
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.categories.length.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-neutral-400">
                カテゴリ数
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 検索 */}
      <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 dark:bg-neutral-800 dark:border-neutral-700">
        <h3 className="text-lg font-medium text-gray-800 mb-3 dark:text-neutral-200">
          保存済みデータ検索
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="統計名、表題、項目名で検索..."
            className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "検索中..." : "検索"}
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* 検索結果 */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-xs border border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-neutral-200">
              検索結果 ({searchResults.length}件)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    統計表ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    政府統計名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    統計表題名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    項目名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    単位
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                {searchResults.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-700"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-neutral-200">
                      {item.stats_data_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-200">
                      {item.stat_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-200">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-200">
                      {item.cat01 || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-200">
                      {item.item_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-200">
                      {item.unit || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
