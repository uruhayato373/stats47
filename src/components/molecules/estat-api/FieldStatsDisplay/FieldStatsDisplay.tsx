/**
 * 統計数表示コンポーネント
 * 責務: 統計数の表示・フォーマットのみ
 */

import { FieldStats } from "@/hooks/estat-api/useFieldStats";

interface FieldStatsDisplayProps {
  stats: FieldStats | undefined;
  isLoading: boolean;
  showStatsCount: boolean;
  formatCount: (count: number) => string;
}

/**
 * 統計数表示コンポーネント
 * @param stats - 統計数データ
 * @param isLoading - ローディング状態
 * @param showStatsCount - 統計数表示フラグ
 * @param formatCount - 数値フォーマット関数
 */
export function FieldStatsDisplay({
  stats,
  isLoading,
  showStatsCount,
  formatCount,
}: FieldStatsDisplayProps) {
  if (!showStatsCount) return null;

  const count = stats?.count || 0;

  if (isLoading) {
    return (
      <div className="mt-2">
        <div className="text-xs text-gray-400">統計数: 取得中...</div>
      </div>
    );
  }

  return (
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
  );
}
