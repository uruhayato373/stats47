import { logger } from "@stats47/logger/server";

import { listRankingValuesAllYears, upsertRankingValues } from "../repositories/ranking-value";

import type { RankingItem, RankingValue } from "../types";

/** Web runtimeでは外部APIを呼ばず、正典R2から指定年を読む。 */
export async function fetchRankingValuesFromSource(
  rankingItem: RankingItem,
  yearCode: string,
): Promise<RankingValue[]> {
  const { rankingKey, areaType } = rankingItem;
  const canonical = await listRankingValuesAllYears(rankingKey, areaType);
  return canonical.success
    ? canonical.data.filter((value) => value.yearCode === yearCode)
    : [];
}

/** Phase 7以降はno-opの互換cache interface。 */
export async function cacheRankingValues(
  rankingItem: RankingItem,
  yearCode: string,
  values: RankingValue[],
): Promise<void> {
  const { rankingKey, areaType } = rankingItem;
  try {
    await upsertRankingValues(rankingKey, areaType, yearCode, values);
  } catch (error) {
    logger.warn(
      { error, rankingKey, areaType, yearCode },
      "cacheRankingValues: キャッシュ保存に失敗（処理は継続）",
    );
  }
}

/** 指定年の正典R2値を返す。 */
export async function fetchRankingValuesOnDemand(
  rankingItem: RankingItem,
  yearCode: string,
): Promise<RankingValue[]> {
  const values = await fetchRankingValuesFromSource(rankingItem, yearCode);
  if (values.length > 0) await cacheRankingValues(rankingItem, yearCode, values);
  return values;
}

/** 正典R2から全年度を取得する。外部API fallbackは持たない。 */
export async function fetchAllYearsRankingValuesOnDemand(
  rankingItem: RankingItem,
): Promise<RankingValue[]> {
  const { rankingKey, areaType } = rankingItem;
  const result = await listRankingValuesAllYears(rankingKey, areaType);
  return result.success ? result.data : [];
}
