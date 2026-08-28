import { logger } from "@stats47/logger/server";

import { listRankingValuesAllYears } from "../repositories/ranking-value";
import { rankByValue } from "../utils/rank-by-value";

import type { RankingItem, RankingValue, SyncRankingResult } from "../types";

/**
 * 後方互換名。Web runtimeではe-Statを呼ばず、MetricConfigから生成済みの正典R2を読む。
 */
export async function fetchEstatRankingData(
  rankingItem: RankingItem,
  options?: { isAborted?: () => boolean },
): Promise<SyncRankingResult> {
  const { rankingKey, areaType } = rankingItem;
  if (options?.isAborted?.()) return { success: false, error: "処理が中断されました" };

  try {
    const result = await listRankingValuesAllYears(rankingKey, areaType);
    if (!result.success || result.data.length === 0) {
      return { success: false, error: `R2に観測値がありません (rankingKey: ${rankingKey})` };
    }

    const byYear = new Map<string, RankingValue[]>();
    for (const value of result.data) {
      const rows = byYear.get(value.yearCode) ?? [];
      rows.push(value);
      byYear.set(value.yearCode, rows);
    }
    const years = [...byYear.keys()]
      .sort((left, right) => right.localeCompare(left))
      .map((yearCode) => ({
        yearCode,
        yearName: byYear.get(yearCode)?.[0]?.yearName ?? yearCode,
      }));
    const allYearsValues = years.flatMap(({ yearCode }) =>
      rankByValue(byYear.get(yearCode) ?? []) as RankingValue[],
    );
    const latestYearValues = allYearsValues.filter(
      (value) => value.yearCode === years[0]?.yearCode,
    );

    return {
      success: true,
      message: `正典R2から最新年度(${years[0]?.yearCode ?? "N/A"})を含む全${years.length}年度分を取得しました`,
      years,
      latestYearValues,
      allYearsValues,
    };
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "fetchEstatRankingData: R2取得に失敗");
    return {
      success: false,
      error: error instanceof Error ? error.message : "R2からデータを取得できませんでした",
    };
  }
}
