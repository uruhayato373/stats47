import { useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Calendar,
  Building2,
  Tag,
} from "lucide-react";
import { StatsListSearchResult } from "@/lib/estat-stats-list-manager";

interface StatsListSearchTabProps {
  data: StatsListSearchResult | null;
  loading: boolean;
  error: string | null;
  onSearch: (query: string, filters?: any) => Promise<void>;
}

export default function StatsListSearchTab({
  data,
  loading,
  error,
  onSearch,
}: StatsListSearchTabProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<
    "full" | "stat_name" | "title" | "gov_org" | "category"
  >("full");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    surveyYears: "",
    statsField: "",
    statsCode: "",
    collectArea: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const searchFilters = {
      searchType,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value.trim() !== "")
      ),
    };

    await onSearch(query, searchFilters);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* 検索フォーム */}
      <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="search-query"
                className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2"
              >
                検索キーワード
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="search-query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="統計表名、タイトル、政府機関名で検索..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="lg:w-48">
              <label
                htmlFor="search-type"
                className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2"
              >
                検索対象
              </label>
              <select
                id="search-type"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                disabled={loading}
              >
                <option value="full">全項目</option>
                <option value="stat_name">統計名</option>
                <option value="title">タイトル</option>
                <option value="gov_org">政府機関</option>
                <option value="category">カテゴリ</option>
              </select>
            </div>

            <div className="lg:w-32 flex items-end">
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "検索中..." : "検索"}
              </button>
            </div>
          </div>

          {/* フィルタ切り替えボタン */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200"
          >
            <Filter className="w-4 h-4" />
            詳細フィルタ
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* 詳細フィルタ */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-neutral-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  調査年
                </label>
                <input
                  type="text"
                  value={filters.surveyYears}
                  onChange={(e) =>
                    handleFilterChange("surveyYears", e.target.value)
                  }
                  placeholder="2023"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  <Tag className="inline w-4 h-4 mr-1" />
                  統計分野
                </label>
                <input
                  type="text"
                  value={filters.statsField}
                  onChange={(e) =>
                    handleFilterChange("statsField", e.target.value)
                  }
                  placeholder="分野コード"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  <Building2 className="inline w-4 h-4 mr-1" />
                  統計コード
                </label>
                <input
                  type="text"
                  value={filters.statsCode}
                  onChange={(e) =>
                    handleFilterChange("statsCode", e.target.value)
                  }
                  placeholder="統計コード"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  収集地域
                </label>
                <input
                  type="text"
                  value={filters.collectArea}
                  onChange={(e) =>
                    handleFilterChange("collectArea", e.target.value)
                  }
                  placeholder="地域コード"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <strong>エラー:</strong> {error}
          </div>
        </div>
      )}

      {/* 検索結果 */}
      {data && (
        <div className="space-y-4">
          {/* 結果サマリー */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100">
              検索結果 ({data.totalAvailable.toLocaleString()}件)
            </h3>
            <div className="text-sm text-gray-500 dark:text-neutral-400">
              検索実行: {new Date().toLocaleString()}
            </div>
          </div>

          {/* 統計表一覧 */}
          <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                <thead className="bg-gray-50 dark:bg-neutral-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      統計表情報
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      政府機関
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      カテゴリ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      調査日
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                  {data.data?.map((entry) => (
                    <tr
                      key={entry.statsDataId}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-700"
                    >
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                            {entry.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-neutral-400">
                            {entry.statName}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-neutral-500">
                            ID: {entry.statsDataId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-neutral-100">
                          {entry.govOrg}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-neutral-100">
                          -
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-neutral-100">
                        {entry.surveyDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ページネーション（今後実装） */}
          {data.totalAvailable > (data.data?.length || 0) && (
            <div className="flex justify-center">
              <div className="text-sm text-gray-500 dark:text-neutral-400">
                ページネーション機能は今後実装予定です
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
