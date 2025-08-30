"use client";

import { useState, useEffect } from "react";

interface SavedMetadata {
  id: string;
  statsDataId: string;
  statName: string;
  title: string;
  category: string;
  itemName: string;
  unit: string;
  updatedAt: string;
}

export default function SavedMetadataDisplay() {
  const [metadata, setMetadata] = useState<SavedMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // サンプルデータ（実際の実装ではCloudflare D1から取得）
  const sampleData: SavedMetadata[] = [
    {
      id: "1",
      statsDataId: "0003448237",
      statName: "人口推計",
      title: "人口推計（令和5年10月1日現在）",
      category: "人口・世帯",
      itemName: "総人口",
      unit: "人",
      updatedAt: "2024-01-15",
    },
    {
      id: "2",
      statsDataId: "0003348237",
      statName: "世帯数",
      title: "世帯数調査（令和5年）",
      category: "人口・世帯",
      itemName: "一般世帯数",
      unit: "世帯",
      updatedAt: "2024-01-10",
    },
  ];

  useEffect(() => {
    // 実際の実装では、Cloudflare D1からデータを取得
    setTimeout(() => {
      setMetadata(sampleData);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredMetadata = metadata.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.statName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(metadata.map((item) => item.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600 dark:text-neutral-400">
          データを読み込み中...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
        <p className="text-red-800 dark:text-red-200">エラー: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
          保存済みメタデータ
        </h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          データベースに保存されているe-Statメタ情報を表示・検索できます。
        </p>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              キーワード検索
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="統計名、タイトル、項目名で検索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              カテゴリ
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-neutral-100">
            検索結果
          </h4>
          <span className="text-sm text-gray-600 dark:text-neutral-400">
            {filteredMetadata.length}件
          </span>
        </div>

        {filteredMetadata.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
            条件に一致するデータが見つかりませんでした。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
              <thead className="bg-gray-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">
                    統計表ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">
                    統計名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">
                    項目名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">
                    単位
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">
                    更新日
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                {filteredMetadata.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-neutral-100">
                      {item.statsDataId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                      {item.statName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-neutral-100">
                      <div className="max-w-xs truncate" title={item.title}>
                        {item.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                      {item.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                      {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-neutral-400">
                      {item.updatedAt}
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
