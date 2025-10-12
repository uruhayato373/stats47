import { useState, useEffect } from "react";
import { BarChart3, Database, Calendar, RefreshCw } from "lucide-react";
import { StatsListSummary } from "@/lib/estat-stats-list-manager";

export default function StatsListSummaryTab() {
  const [summary, setSummary] = useState<StatsListSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/estat/statslist/summary");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as StatsListSummary;
      setSummary(data);
    } catch (err) {
      console.error("Summary fetch error:", err);
      setError(
        err instanceof Error ? err.message : "サマリー取得に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600 dark:text-neutral-400">
          読み込み中...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <strong>エラー:</strong> {error}
        </div>
        <button
          onClick={fetchSummary}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-neutral-400">
          データがありません
        </p>
        <button
          onClick={fetchSummary}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 underline"
        >
          読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 概要カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-6">
          <div className="flex items-center">
            <Database className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100">
                総統計表数
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {summary.totalTables.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-6">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100">
                ユニーク統計数
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {summary.uniqueStats.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-6">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100">
                データ期間
              </h3>
              <p className="text-sm text-gray-600 dark:text-neutral-400">
                {summary.dateRange.earliest} ～ {summary.dateRange.latest}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* カテゴリ別統計 */}
        <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-4">
            統計分野別 (上位10件)
          </h3>
          <div className="space-y-3">
            {summary.categories.map((category, index) => (
              <div
                key={category.code}
                className="flex justify-between items-center"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                    {category.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-neutral-400">
                    {category.code}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                    {category.count.toLocaleString()}
                  </div>
                  <div className="w-20 bg-gray-200 dark:bg-neutral-700 rounded-full h-2 mt-1">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (category.count /
                            Math.max(
                              ...summary.categories.map((c) => c.count)
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 政府機関別統計 */}
        <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-4">
            政府機関別 (上位10件)
          </h3>
          <div className="space-y-3">
            {summary.governmentOrgs.map((org, index) => (
              <div key={org.code} className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                    {org.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-neutral-400">
                    {org.code}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                    {org.count.toLocaleString()}
                  </div>
                  <div className="w-20 bg-gray-200 dark:bg-neutral-700 rounded-full h-2 mt-1">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (org.count /
                            Math.max(
                              ...summary.governmentOrgs.map((o) => o.count)
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最終更新情報 */}
      {summary.lastUpdated && (
        <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-neutral-400">
            最終更新: {new Date(summary.lastUpdated).toLocaleString()}
          </div>
        </div>
      )}

      {/* 更新ボタン */}
      <div className="flex justify-center">
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 inline mr-2 ${loading ? "animate-spin" : ""}`}
          />
          サマリーを更新
        </button>
      </div>
    </div>
  );
}
