/**
 * 統計分野サイドバーコンポーネント
 * 責務: 17分野をコンパクトなリスト形式で表示・選択
 */

"use client";

import { STATS_FIELDS, StatsFieldCode } from "@/lib/estat-api/types/stats-list";
import { useEstatAPIFieldStats } from "@/hooks/estat-api/useEstatAPIFieldStats";
import { Filter } from "lucide-react";

/**
 * StatsFieldSidebarのプロパティ定義
 */
interface StatsFieldSidebarProps {
  /** 分野選択時のコールバック関数 */
  onFieldSelect: (fieldCode: StatsFieldCode) => void;
  /** 現在選択されている分野コード */
  selectedField?: StatsFieldCode;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * 統計分野サイドバーコンポーネント
 *
 * 機能:
 * - 17の統計分野をコンパクトなリスト形式で表示
 * - 各分野の統計数表示
 * - 分野選択時のコールバック実行
 * - 選択状態の視覚的フィードバック
 * - スクロール可能なリスト表示
 *
 * 設計思想:
 * - サイドバー専用のコンパクトな表示
 * - 統計数はuseEstatAPIFieldStatsフックから取得
 * - 選択状態はラジオボタンで表現
 * - EstatMetainfoPageのサイドバーと同様のデザイン
 *
 * @param onFieldSelect - 分野選択時のコールバック関数
 * @param selectedField - 現在選択されている分野コード
 * @param className - カスタムクラス名
 * @returns JSX要素
 */
export function StatsFieldSidebar({
  onFieldSelect,
  selectedField,
  className = "",
}: StatsFieldSidebarProps) {
  // ===== カスタムフック =====

  /** 統計数取得フック - データ取得とフォーマット機能を委譲 */
  const { fieldStats, isLoading, getFieldStats, formatCount } =
    useEstatAPIFieldStats({
      showStatsCount: true,
    });

  // デバッグ用ログ
  console.log("StatsFieldSidebar - fieldStats:", fieldStats);
  console.log("StatsFieldSidebar - isLoading:", isLoading);

  // ===== レンダリング =====

  return (
    <div
      className={`w-full xl:w-80 bg-white dark:bg-neutral-800 flex flex-col ${className}`}
      style={{ minHeight: "400px" }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          <h3 className="font-medium text-gray-900 dark:text-neutral-100">
            統計分野
          </h3>
        </div>
      </div>

      {/* ローディング表示 */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-sm text-gray-600">統計数を取得中...</span>
        </div>
      )}

      {/* 分野リスト */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-neutral-600">
          {Object.entries(STATS_FIELDS).map(([fieldCode, field]) => {
            const stats = getFieldStats(fieldCode as StatsFieldCode);
            const isSelected = selectedField === fieldCode;
            const count = stats?.count || 0;

            return (
              <button
                key={fieldCode}
                onClick={() => onFieldSelect(fieldCode as StatsFieldCode)}
                className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors ${
                  isSelected ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* ラジオボタン */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-gray-300 dark:border-neutral-600"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>

                    {/* 分野情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{field.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                            {field.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-neutral-400">
                            コード: {fieldCode}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 統計数 */}
                  <div className="flex-shrink-0">
                    <div className="text-xs text-gray-600 dark:text-neutral-400">
                      {formatCount(count)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 統計数サマリー */}
      {fieldStats.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700/50">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-neutral-400">
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
    </div>
  );
}
