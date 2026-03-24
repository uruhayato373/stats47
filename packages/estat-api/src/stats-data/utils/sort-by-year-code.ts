import type { StatsSchema } from "@stats47/types";

/**
 * 年度でソート
 *
 * @param statsSchemas - 統計データの配列
 * @returns 年度順にソートされた配列
 */
export function sortByYearCode(
  statsSchemas: StatsSchema[]
): StatsSchema[] {
  return [...statsSchemas].sort((a, b) =>
    a.yearCode.localeCompare(b.yearCode)
  );
}
