import type { GetStatsDataParams } from "@stats47/estat-api/server";

/** stats-line-chart カードの componentProps 型 */
export interface StatsLineChartProps {
  /** StatCard 用（全国最新値） */
  statParams: GetStatsDataParams;
  /** 単位（省略時は e-Stat データから取得） */
  unit?: string;
  /** LineChart 用（時系列） — 複数系列対応 */
  lineParams: GetStatsDataParams | GetStatsDataParams[];
  /** 系列ラベル（lineParams が配列の場合） */
  labels?: string[];
  /** 説明文 */
  description?: string;
}

/** componentType → componentProps の型マッピング */
export interface RankingPageCardPropsMap {
  "stats-line-chart": StatsLineChartProps;
}
