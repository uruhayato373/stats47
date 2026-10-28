import {
  computeRankingStats,
  rankByValue,
  type RankingValue,
} from "@stats47/ranking";

import type { StatsSchema } from "@stats47/types";

export type RankingDataRow = RankingValue & {
  deviationValue: number | null;
};

/**
 * 表と県の詳細パネルが共有する行 (全国 00000 を除き、順位と偏差値を付ける)。
 * 2 か所で別々に計算すると、同じ県の順位や偏差値が食い違いうるので、ここだけで計算する。
 */
export function buildRankingRows(rankingValues: (StatsSchema | RankingValue)[] | null | undefined): RankingDataRow[] {
  if (!rankingValues) return [];
  const statistics = computeRankingStats(rankingValues);

  const validItems: StatsSchema[] = [];
  for (const item of rankingValues) {
    if (item.areaCode !== "00000") {
      validItems.push(item);
    }
  }

  return rankByValue(validItems).map((item) => {
    let deviationValue: number | null = null;
    if (statistics && statistics.hasVariation) {
      deviationValue =
        50 +
        (10 * ((item.value ?? 0) - statistics.mean)) / statistics.standardDeviation;
    } else if (statistics) {
      deviationValue = 50;
    }
    return { ...item, deviationValue };
  });
}
