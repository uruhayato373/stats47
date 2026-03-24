"use server";

import type { RankingValue } from "@stats47/ranking";
import {
  findRankingItem,
  fetchRankingValuesFromSource,
  filterOutNationalArea,
  rankByValue,
} from "@stats47/ranking/server";
import {
  fetchFormattedStats,
  type GetStatsDataParams,
} from "@stats47/estat-api/server";
import { isOk } from "@stats47/types";

import { getEstatCacheStorage } from "@/features/stat-charts/services/get-estat-cache-storage";

/**
 * 指定指標・年度のランキングデータを取得するサーバーアクション
 *
 * e-Stat API から cdTime/cdArea 指定なしで全年度・全都道府県を一括取得（R2 キャッシュ共有）し、
 * yearCode でメモリフィルタして返す。
 */
export async function fetchIndicatorForYearAction(
  rankingKey: string,
  yearCode: string,
): Promise<RankingValue[]> {
  const result = await findRankingItem(rankingKey, "prefecture");
  if (!result || !isOk(result) || !result.data) return [];

  const rankingItem = result.data;
  const { sourceConfig, calculation } = rankingItem;

  // 計算型アイテムは既存ロジックに委譲
  if (calculation?.isCalculated) {
    return fetchRankingValuesFromSource(rankingItem, yearCode);
  }

  if (!sourceConfig?.statsDataId) return [];

  try {
    const params: GetStatsDataParams = {
      ...(sourceConfig as GetStatsDataParams),
    };
    const storage = await getEstatCacheStorage();
    const rawData = await fetchFormattedStats(params, storage);
    const filteredData = filterOutNationalArea(rawData)
      .filter((d) => d.yearCode === yearCode);
    if (filteredData.length === 0) return [];

    return rankByValue(filteredData) as RankingValue[];
  } catch {
    return [];
  }
}
