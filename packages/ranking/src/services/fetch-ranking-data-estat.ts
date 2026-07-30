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
import { isDerivedSource, resolveEstatParams } from "../utils/source-config";
import type { SyncRankingResult } from "../types";

/**
 * e-Stat APIからランキングデータを取得する
 */
export async function fetchEstatRankingData(
  rankingItem: RankingItem,
  options?: { isAborted?: () => boolean }
): Promise<SyncRankingResult> {
  const { rankingKey, areaType, sourceConfig } = rankingItem;

  // ★クエリ部の解決は resolveEstatParams に一本化する (sourceConfig を丸ごと spread しない)。
  //   丸ごと spread すると (a) cdCat03/04/05・cdTab が欠けて多系列が混入し、
  //   (b) source/note のような非クエリキーが param に混ざる。
  const estatParams = resolveEstatParams(sourceConfig);
  if (!estatParams) {
    logger.warn(
      { rankingKey, areaType, sourceConfig },
      "statsDataIdが未設定のためe-Stat APIデータ取得をスキップ"
    );
    return {
      success: false,
      error: `statsDataIdが未設定です (rankingKey: ${rankingKey})`,
    };
  }

  // 宣言演算 (tab 線形結合 / 軸合算 / 率 / 県庁所在市写像) を伴う metric は
  // 単発クエリでは再現できない。生値を配ると変換前の数字が出るのでここでは扱わない。
  if (isDerivedSource(sourceConfig)) {
    return {
      success: false,
      error: `derived metric は e-Stat 単発クエリで再現できません (rankingKey: ${rankingKey})`,
    };
  }

  try {
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
