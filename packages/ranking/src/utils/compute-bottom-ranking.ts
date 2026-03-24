import type { StatsSchema } from "@stats47/types";
import { computeSortedRankings } from "./compute-sorted-rankings";

/**
 * 最下位のランキングデータ（統計データ）を取得
 * 
 * @param data - 統計データ
 * @returns 最下位のデータ、またはnull（データが空の場合）
 */
export function computeBottomRanking<T extends StatsSchema>(
  data: T[]
): T | null {
  const result = computeSortedRankings(data, { order: "asc", limit: 1 });
  return result.length > 0 ? (result[0] as T) : null;
}
