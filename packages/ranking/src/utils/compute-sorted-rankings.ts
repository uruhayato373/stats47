import type { StatsSchema } from "@stats47/types";
import { filterOutNationalArea } from "./filter-out-national-area";

/**
 * 統計データをランキング表示用に加工（フィルタリング・ソート・件数制限）する
 * 
 * areaCode=00000（全国合計）のデータを除外して、指定された順序でソートします。
 * 
 * @param data - 統計データ配列
 * @param options - オプション
 * @param options.order - ソート順（'asc' | 'desc'）、デフォルト: 'desc'
 * @param options.limit - 件数制限（指定した場合、上位N件のみ返す）
 * @param options.excludeNational - 全国データを除外するか、デフォルト: true
 * @returns 加工された統計データ配列
 */
export function computeSortedRankings<T extends StatsSchema>(
  data: T[],
  options: {
    order?: 'asc' | 'desc';
    limit?: number;
    excludeNational?: boolean;
  } = {}
): T[] {
  const { order = 'desc', limit, excludeNational = true } = options;

  let processed = excludeNational ? (filterOutNationalArea(data) as T[]) : [...data];

  processed.sort((a, b) => {
    return order === "desc" ? b.value - a.value : a.value - b.value;
  });

  return limit ? processed.slice(0, limit) : processed;
}
