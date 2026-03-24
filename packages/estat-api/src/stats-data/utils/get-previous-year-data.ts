import type { StatsSchema } from "@stats47/types";
import { sortByYearCode } from "./sort-by-year-code";

/**
 * 前年度のデータを取得
 *
 * @param statsSchemas - 統計データの配列（年度順にソート済み推奨）
 * @returns 前年度のデータ、存在しない場合はundefined
 */
export function getPreviousYearData(
  statsSchemas: StatsSchema[]
): StatsSchema | undefined {
  if (statsSchemas.length < 2) {
    return undefined;
  }
  const sortedSchemas = sortByYearCode(statsSchemas);
  return sortedSchemas[sortedSchemas.length - 2];
}
