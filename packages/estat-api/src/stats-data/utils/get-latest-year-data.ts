import { StatsSchema } from "@stats47/types";
import { sortByYearCode } from "./sort-by-year-code";

/**
 * 最新年度のデータを取得
 *
 * @param statsSchemas - 統計データの配列（年度順にソート済み）
 * @returns 最新年度のデータのみの配列
 */
export function getLatestYearData(
  statsSchemas: StatsSchema[]
): StatsSchema[] {
  if (statsSchemas.length === 0) {
    return [];
  }

  const sortedSchemas = sortByYearCode(statsSchemas);
  const latestYearCode = sortedSchemas[sortedSchemas.length - 1]?.yearCode;

  if (!latestYearCode) {
    return [];
  }

  return sortedSchemas.filter((s) => s.yearCode === latestYearCode);
}
