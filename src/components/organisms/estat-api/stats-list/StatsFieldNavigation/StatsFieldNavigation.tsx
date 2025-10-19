/**
 * 統計分野ナビゲーションコンポーネント
 * 責務: 17分野の選択UI表示のみ
 */

"use client";

import { STATS_FIELDS, StatsFieldCode } from "@/lib/estat-api/types/stats-list";
import { useFieldStats } from "@/hooks/estat-api/useFieldStats";
import { FieldStatsDisplay } from "@/components/molecules/estat-api/FieldStatsDisplay";
import { FieldDescription } from "@/components/molecules/estat-api/FieldDescription";

interface StatsFieldNavigationProps {
  onFieldSelect: (fieldCode: StatsFieldCode) => void;
  selectedField?: StatsFieldCode;
  showStatsCount?: boolean;
}

export function StatsFieldNavigation({
  onFieldSelect,
  selectedField,
  showStatsCount = true,
}: StatsFieldNavigationProps) {
  // 統計数取得フック
  const { fieldStats, isLoading, getFieldStats, formatCount } = useFieldStats({
    showStatsCount,
  });

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
                  <FieldStatsDisplay
                    stats={stats}
                    isLoading={isLoading}
                    showStatsCount={showStatsCount}
                    formatCount={formatCount}
                  />
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
      <FieldDescription />
    </div>
  );
}
