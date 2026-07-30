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
import { isDerivedSource, resolveEstatParams } from "../utils/source-config";

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

  // 宣言演算 (tab 線形結合 / 軸合算 / 率 / 県庁所在市写像) を伴う metric は
  // 単発クエリで再現できない。e-Stat を叩くと変換前の生値が出るので、
  // 取り込み済みの正典 (app/stats/<key>/values.json) から返す。
  if (isDerivedSource(sourceConfig)) {
    const canonical = await listRankingValuesAllYears(rankingKey, areaType);
    return canonical.success ? canonical.data.filter((v) => v.yearCode === yearCode) : [];
  }

  // ★sourceConfig を丸ごと spread しない (cdCat03/04/05・cdTab 欠落と非クエリキー混入を防ぐ)
  const params = resolveEstatParams(sourceConfig);
  if (!params) return [];

  try {
    // cdTimeFrom/cdTimeTo を指定せず全年度を一括取得し、R2 キャッシュを共有する。
    // yearCode によるフィルタはメモリ上で行う。
    const rawData = await fetchFormattedStats(params as GetStatsDataParams);
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
 * ランキング値をキャッシュ保存する (Phase 7 以降 upsertRankingValues は no-op)。
 */
export async function cacheRankingValues(
  rankingItem: RankingItem,
  yearCode: string,
  values: RankingValue[]
): Promise<void> {
  const { rankingKey, areaType } = rankingItem;
  try {
    await upsertRankingValues(
      rankingKey,
      areaType,
      yearCode,
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
 * ランキングデータをオンデマンド取得する (キャッシュ保存は Phase 7 以降 no-op)。
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

  // 宣言演算を伴う metric は e-Stat 単発クエリで再現できない。
  // dbValues は既に正典 (app/stats/<key>/values.json) 由来なのでそのまま返す。
  if (isDerivedSource(sourceConfig)) return dbValues;

  const params = resolveEstatParams(sourceConfig);
  if (!params) return dbValues;

  // 2. e-Stat API から全年度を一括取得（cdTime 指定なし）
  try {
    const rawData = await fetchFormattedStats(params as GetStatsDataParams);
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
