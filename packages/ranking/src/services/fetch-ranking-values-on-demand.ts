import {
  type GetStatsDataParams,
  extractYearsFromStats,
  fetchFormattedStats,
} from "@stats47/estat-api/server";
import { logger } from "@stats47/logger/server";
import { listRankingValuesAllYears, upsertRankingValues } from "../repositories/ranking-value";
import type { RankingItem, RankingValue } from "../types";
import { filterOutNationalArea } from "../utils/filter-out-national-area";
import { rankByValue } from "../utils/rank-by-value";

/**
 * e-Stat API からランキングデータをオンデマンド取得する（DB書き込みなし）。
 * 計算型アイテムの場合は calculateRankingValues に委譲する。
 */
export async function fetchRankingValuesFromSource(
  rankingItem: RankingItem,
  yearCode: string,
): Promise<RankingValue[]> {
  const { rankingKey, areaType, sourceConfig, calculation } = rankingItem;

  // 計算型アイテムの場合
  if (calculation?.isCalculated) {
    // 循環参照を避けるため動的 import
    const { calculateRankingValues } = await import("./calculate-ranking-values");
    return calculateRankingValues(rankingItem, yearCode);
  }

  if (!sourceConfig?.statsDataId) return [];

  try {
    // cdTimeFrom/cdTimeTo を指定せず全年度を一括取得し、R2 キャッシュを共有する。
    // yearCode によるフィルタはメモリ上で行う。
    const params: GetStatsDataParams = {
      ...(sourceConfig as GetStatsDataParams),
    };

    const rawData = await fetchFormattedStats(params);
    const filteredData = filterOutNationalArea(rawData)
      .filter((d) => d.yearCode === yearCode);
    if (filteredData.length === 0) return [];

    return rankByValue(filteredData) as RankingValue[];
  } catch (error) {
    logger.error(
      { error, rankingKey, areaType, yearCode },
      "fetchRankingValuesFromSource: e-Stat API からの取得に失敗"
    );
    return [];
  }
}

/**
 * ランキング値を D1 にキャッシュ保存する。
 */
export async function cacheRankingValues(
  rankingItem: RankingItem,
  yearCode: string,
  values: RankingValue[]
): Promise<void> {
  const { rankingKey, areaType, title, availableYears } = rankingItem;
  try {
    const yearEntry = availableYears?.find((y) => y.yearCode === yearCode);
    await upsertRankingValues(
      rankingKey,
      areaType,
      yearCode,
      yearEntry?.yearName,
      title,
      values
    );
  } catch (error) {
    logger.warn(
      { error, rankingKey, areaType, yearCode },
      "cacheRankingValues: キャッシュ保存に失敗（処理は継続）"
    );
  }
}

/**
 * ランキングデータをオンデマンド取得し、D1 にキャッシュ保存する。
 * fetchRankingValuesFromSource + cacheRankingValues の便利関数。
 */
export async function fetchRankingValuesOnDemand(
  rankingItem: RankingItem,
  yearCode: string,
): Promise<RankingValue[]> {
  const values = await fetchRankingValuesFromSource(rankingItem, yearCode);

  if (values.length > 0) {
    await cacheRankingValues(rankingItem, yearCode, values);
  }

  return values;
}

/**
 * 全年度のランキングデータを取得する。
 * DB キャッシュを確認し、不足分があれば e-Stat API から一括取得してキャッシュする。
 * 計算型アイテムには非対応（DB にあるデータのみ返す）。
 */
export async function fetchAllYearsRankingValuesOnDemand(
  rankingItem: RankingItem,
): Promise<RankingValue[]> {
  const { rankingKey, areaType, sourceConfig, calculation, availableYears } = rankingItem;

  // 1. DB から全年度データを取得
  const dbResult = await listRankingValuesAllYears(rankingKey, areaType);
  const dbValues = dbResult.success ? dbResult.data : [];

  // DB にある年度を集計
  const cachedYears = new Set(dbValues.map((v) => v.yearCode));
  const totalYears = availableYears?.length ?? 0;

  // 全年度キャッシュ済みならそのまま返す
  if (cachedYears.size >= totalYears) {
    return dbValues;
  }

  // 計算型アイテムは全年度一括取得が複雑なため、DB にあるデータのみ返す
  if (calculation?.isCalculated) {
    return dbValues;
  }

  if (!sourceConfig?.statsDataId) return dbValues;

  // 2. e-Stat API から全年度を一括取得（cdTime 指定なし）
  try {
    const rawData = await fetchFormattedStats(sourceConfig as GetStatsDataParams);
    const filteredData = filterOutNationalArea(rawData);
    if (filteredData.length === 0) return dbValues;

    const years = extractYearsFromStats(filteredData);
    const allValues: RankingValue[] = [];

    for (const year of years) {
      const yearValues = filteredData.filter((v) => v.yearCode === year.yearCode);
      if (yearValues.length > 0) {
        const ranked = rankByValue(yearValues) as RankingValue[];
        allValues.push(...ranked);

        // DB にない年度のみキャッシュ
        if (!cachedYears.has(year.yearCode)) {
          await cacheRankingValues(rankingItem, year.yearCode, ranked);
        }
      }
    }

    return allValues;
  } catch (error) {
    logger.error(
      { error, rankingKey, areaType },
      "fetchAllYearsRankingValuesOnDemand: e-Stat API からの一括取得に失敗"
    );
    return dbValues;
  }
}
