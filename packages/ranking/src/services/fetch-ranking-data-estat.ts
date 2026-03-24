import {
    type GetStatsDataParams,
    extractYearsFromStats,
    fetchFormattedStats,
} from "@stats47/estat-api/server";
import { logger } from "@stats47/logger/server";
import {
    type RankingItem,
    type RankingValue,
    filterOutNationalArea,
    rankByValue,
} from "../index";
import { filterToCityArea } from "../utils/filter-out-national-area";
import type { SyncRankingResult } from "../types";

/**
 * e-Stat APIからランキングデータを取得する
 */
export async function fetchEstatRankingData(
  rankingItem: RankingItem,
  options?: { isAborted?: () => boolean }
): Promise<SyncRankingResult> {
  const { rankingKey, areaType, sourceConfig } = rankingItem;

  // statsDataIdのバリデーション
  if (!sourceConfig?.statsDataId) {
    logger.warn(
      { rankingKey, areaType, sourceConfig },
      "statsDataIdが未設定のためe-Stat APIデータ取得をスキップ"
    );
    return {
      success: false,
      error: `statsDataIdが未設定です (rankingKey: ${rankingKey})`,
    };
  }

  try {
    // sourceConfigからAPI以外のフィールドを除去
    const { source, note, ...estatParams } = sourceConfig as Record<string, unknown>;
    // e-Stat APIから年度指定なしで全データを取得
    const rawData = await fetchFormattedStats(estatParams as GetStatsDataParams);

    // areaType に応じてフィルタ:
    //   prefecture → 都道府県コードのみ残す（全国・市区町村を除外）
    //   city → 市区町村コードのみ残す（全国・都道府県を除外）
    const filteredData = areaType === "city"
      ? filterToCityArea(rawData)
      : filterOutNationalArea(rawData);

    // 年度一覧を抽出
    const years = extractYearsFromStats(filteredData);

    if (years.length === 0) {
      logger.warn({ rankingKey }, "e-Stat APIから年度データが取得できませんでした");
      return { success: false, error: "e-Stat APIからデータが取得できませんでした" };
    }

    // 全年度のランキング値を算出
    const allYearsValues: RankingValue[] = [];
    let latestYearValues: RankingValue[] = [];

    for (const year of years) {
      const rankingValues = filteredData.filter((v) => v.yearCode === year.yearCode);
      if (rankingValues.length > 0) {
        const computed = rankByValue(rankingValues) as RankingValue[];
        allYearsValues.push(...computed);

        // 最新年度のデータを保持（最新年度は years[0]）
        if (year.yearCode === years[0].yearCode) {
          latestYearValues = computed;
        }
      }
    }

    return {
      success: true,
      message: `最新年度(${years[0]?.yearCode || "N/A"})のデータを含む全${years.length}年度分を取得しました`,
      years,
      latestYearValues: latestYearValues.length > 0 ? latestYearValues : undefined,
      allYearsValues: allYearsValues.length > 0 ? allYearsValues : undefined,
    };
  } catch (error) {
    logger.error(
      { error, rankingKey, areaType },
      "fetchEstatRankingData: e-Stat APIからの取得に失敗"
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "e-Stat APIからデータが取得できませんでした",
    };
  }
}
