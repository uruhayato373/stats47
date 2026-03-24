import type { StatsSchema } from "@stats47/types";

/**
 * StatsSchema[]を年度順にソートして最新年度のデータを取得
 *
 * @param statsSchemas - 統計データの配列
 * @returns 最新年度のStatsSchema、データがない場合はundefined
 */
export function getLatestYearStatsSchema(
  statsSchemas: StatsSchema[]
): StatsSchema | undefined {
  if (statsSchemas.length === 0) {
    return undefined;
  }

  // 年度順にソート（新しい配列を作成してソート）
  const sortedSchemas = [...statsSchemas].sort((a, b) =>
    a.yearCode.localeCompare(b.yearCode)
  );

  // 最新年度のデータを取得（最後の要素）
  return sortedSchemas[sortedSchemas.length - 1];
}
