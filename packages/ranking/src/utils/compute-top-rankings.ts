import type { StatsSchema } from "@stats47/types";
import { computeSortedRankings } from "./compute-sorted-rankings";

/**
 * ランキングデータ（統計データ）から上位のデータを抽出する
 *
 * @param data - 統計データ配列
 * @param limit - 取得件数（デフォルト: 3）
 * @returns 上位の統計データ配列
 */
export function computeTopRankings<T extends StatsSchema>(
  data: T[],
  limit: number = 3
): T[] {
  return computeSortedRankings(data, { order: "desc", limit });
}
