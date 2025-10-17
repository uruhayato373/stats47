/**
 * 統計分野ナビゲーションコンポーネント
 * 17分野のビジュアルナビゲーション、各分野の統計数表示、アイコン付きカード表示
 */

"use client";

import { useState, useEffect } from "react";
import { STATS_FIELDS, StatsFieldCode } from "@/lib/estat-api/types/stats-list";
import { EstatStatsListFetcher } from "@/lib/estat-api/stats-list";

interface StatsFieldNavigationProps {
  onFieldSelect: (fieldCode: StatsFieldCode) => void;
  selectedField?: StatsFieldCode;
  showStatsCount?: boolean;
}

interface FieldStats {
  fieldCode: StatsFieldCode;
  count: number;
  isLoading: boolean;
}

export function StatsFieldNavigation({
  onFieldSelect,
  selectedField,
  showStatsCount = true,
}: StatsFieldNavigationProps) {
  const [fieldStats, setFieldStats] = useState<FieldStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 各分野の統計数を取得
  useEffect(() => {
    if (!showStatsCount) return;

    const fetchFieldStats = async () => {
      setIsLoading(true);
      const stats: FieldStats[] = [];

      try {
        // 各分野の統計数を並列で取得
        const promises = Object.keys(STATS_FIELDS).map(async (fieldCode) => {
          try {
            const response = await EstatStatsListFetcher.searchByField(
              fieldCode,
              { limit: 1 }
            );
            return {
              fieldCode: fieldCode as StatsFieldCode,
              count: response.GET_STATS_LIST.DATALIST_INF.NUMBER || 0,
              isLoading: false,
            };
          } catch (error) {
            console.error(`分野 ${fieldCode} の統計数取得エラー:`, error);
            return {
              fieldCode: fieldCode as StatsFieldCode,
              count: 0,
              isLoading: false,
            };
          }
        });

        const results = await Promise.all(promises);
        setFieldStats(results);
      } catch (error) {
        console.error("分野統計数取得エラー:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFieldStats();
  }, [showStatsCount]);

  const getFieldStats = (fieldCode: StatsFieldCode) => {
    return fieldStats.find((stat) => stat.fieldCode === fieldCode);
  };

  const formatCount = (count: number) => {
    if (count >= 10000) {
      return `${Math.floor(count / 1000)}k+`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          統計分野から探す
        </h2>
        <p className="text-sm text-gray-600">
          17の統計分野から興味のある分野を選択して統計表を検索できます
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">統計数を取得中...</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(STATS_FIELDS).map(([fieldCode, field]) => {
          const stats = getFieldStats(fieldCode as StatsFieldCode);
          const isSelected = selectedField === fieldCode;
          const count = stats?.count || 0;

          return (
            <button
              key={fieldCode}
              onClick={() => onFieldSelect(fieldCode as StatsFieldCode)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0">{field.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {field.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    コード: {fieldCode}
                  </div>
                  {showStatsCount && stats && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600">
                        統計表数:
                        <span
                          className={`ml-1 font-medium ${
                            count > 0 ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          {formatCount(count)}
                        </span>
                      </div>
                    </div>
                  )}
                  {showStatsCount && !stats && !isLoading && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-400">
                        統計数: 取得中...
                      </div>
                    </div>
                  )}
                </div>
                {isSelected && (
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 統計数サマリー */}
      {showStatsCount && fieldStats.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>全分野合計:</span>
            <span className="font-medium">
              {formatCount(
                fieldStats.reduce((sum, stat) => sum + stat.count, 0)
              )}
              件
            </span>
          </div>
        </div>
      )}

      {/* 分野説明 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">分野の説明</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            • <strong>国土・気象:</strong> 地理、気象、災害に関する統計
          </p>
          <p>
            • <strong>人口・世帯:</strong> 人口動態、世帯構成に関する統計
          </p>
          <p>
            • <strong>労働・賃金:</strong> 就業状況、賃金水準に関する統計
          </p>
          <p>
            • <strong>企業・家計・経済:</strong> 経済活動、企業活動に関する統計
          </p>
          <p>
            • <strong>社会保障・衛生:</strong> 医療、福祉、健康に関する統計
          </p>
        </div>
      </div>
    </div>
  );
}
