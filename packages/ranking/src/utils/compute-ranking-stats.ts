import type { StatsSchema } from "@stats47/types";
import { computeDescriptiveStats } from "@stats47/utils";
import type { RankingStats } from "../types";
import { filterOutNationalArea } from "./filter-out-national-area";

/**
 * 統計データの詳細統計（合計、平均、中央値、最大値、最小値、標準偏差等）を計算
 * 
 * areaCode=00000（全国合計）のデータを除外して計算します。
 * 
 * @param data - 統計データ配列
 * @returns 統計情報、またはnull（データが空の場合）
 */
export function computeRankingStats(
  data: StatsSchema[]
): RankingStats | null {
  if (!data || data.length === 0) return null;

  // 全国データを除外
  const filteredData = filterOutNationalArea(data);
  if (filteredData.length === 0) return null;

  // 値の配列を取得
  const values = filteredData.map((item) => item.value);

  // 汎用統計計算関数を使用
  // Note: @stats47/utils は monorepo 内のパッケージとして解決される前提
  // もし解決できない場合は相対パスに変更するか、ビルドが必要になる
  const stats = computeDescriptiveStats(values);

  if (!stats) return null;

  return {
    sum: stats.sum,
    mean: stats.mean,
    median: stats.median,
    max: stats.max,
    min: stats.min,
    standardDeviation: stats.standardDeviation,
    coefficientOfVariation: stats.coefficientOfVariation,
    hasVariation: stats.standardDeviation > 0,
    count: stats.count,
  };
}
