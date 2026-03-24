import { logger } from "@stats47/logger/server";
import type { AreaType } from "@stats47/types";
import {
    type RankingItem,
    type RankingValue,
    computeCalculatedValues,
    rankByValue,
} from "../index";
import { findRankingItemByKey } from "../repositories/ranking-item";
import { listRankingValues } from "../repositories/ranking-value";
import type { SyncRankingResult } from "../types";

import { fetchRankingData } from "./fetch-ranking-data";

/**
 * 計算によってランキングデータを生成する
 */
export async function fetchCalculatedRankingData(
  rankingItem: RankingItem,
  options?: { isAborted?: () => boolean }
): Promise<SyncRankingResult> {
  const { rankingKey, areaType, calculation } = rankingItem;

  if (!calculation?.numeratorKey || !calculation.denominatorKey) {
    return {
      success: false,
      error: `計算設定（分子または分母のキー）が不足しています (rankingKey: ${rankingKey})`,
    };
  }

  try {
    return await fetchCalculatedRankingDataInner(rankingItem, options);
  } catch (error) {
    logger.error(
      { error, rankingKey, areaType },
      "fetchCalculatedRankingData: 計算型データ取得に失敗"
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "計算型データが取得できませんでした",
    };
  }
}

async function fetchCalculatedRankingDataInner(
  rankingItem: RankingItem,
  options?: { isAborted?: () => boolean }
): Promise<SyncRankingResult> {
  const { rankingKey, areaType, title, unit } = rankingItem;
  // calculation と必須キーは外側関数で検証済みだが、型安全のため再確認
  const calculation = rankingItem.calculation;
  if (!calculation?.numeratorKey || !calculation.denominatorKey) {
    return { success: false, error: `計算設定が不足しています (rankingKey: ${rankingKey})` };
  }

  logger.info(
    {
      rankingKey,
      numerator: calculation.numeratorKey,
      denominator: calculation.denominatorKey,
    },
    "計算型アイテムのエクスポートを開始"
  );

  // 分子と分母のメタデータを取得して、共通の年度を特定 (D1から取得)
  const [numItemResult, denItemResult] = await Promise.all([
    findRankingItemByKey(calculation.numeratorKey),
    findRankingItemByKey(calculation.denominatorKey),
  ]);
  const numItem = numItemResult.success ? numItemResult.data : null;
  const denItem = denItemResult.success ? denItemResult.data : null;

  if (!numItem || !denItem) {
    return {
      success: false,
      error:
        "分子または分母のランキングメタデータがD1に見つかりません。先に参照元のエクスポートを実行してください。",
    };
  }

  // 分子・分母の全履歴を事前にメモリにロード（DBに履歴を保存しない方針のため）
  // e-Statアイテムの場合はAPIから直接、そうでない場合はDBから取得を試みる
  const loadDependencyValues = async (depItem: RankingItem): Promise<RankingValue[]> => {
    const result = await fetchRankingData(depItem, options);
    if (result.success && result.allYearsValues) {
      return result.allYearsValues;
    }
    return [];
  };

  const [numHistory, denHistory] = await Promise.all([
    loadDependencyValues(numItem),
    loadDependencyValues(denItem),
  ]);

  const numYears = numItem.availableYears || [];
  const denYears = denItem.availableYears || [];
  const commonYears = numYears.filter((ny: { yearCode: string }) =>
    denYears.some((dy: { yearCode: string }) => dy.yearCode === ny.yearCode)
  );

  if (commonYears.length === 0) {
    return {
      success: false,
      error: "分子と分母で共通する年度のデータが見つかりません",
    };
  }

  // 最新年度を先頭にするため降順ソート
  const sortedCommonYears = [...commonYears].sort((a, b) =>
    b.yearCode.localeCompare(a.yearCode)
  );

  // 全年度のランキング値を算出
  const allYearsValues: RankingValue[] = [];
  let latestYearValues: RankingValue[] = [];

  for (const year of sortedCommonYears) {
    if (options?.isAborted?.()) {
      return { success: false, error: "中断されました" };
    }

    // まずメモリ（history）から取得を試み、なければDBから取得
    let numValues = numHistory.filter(v => v.yearCode === year.yearCode);
    let denValues = denHistory.filter(v => v.yearCode === year.yearCode);

    if (numValues.length === 0 || denValues.length === 0) {
      // メモリになければDBから最新年度分などを取得
      const [numResult, denResult] = await Promise.all([
        listRankingValues(calculation.numeratorKey, areaType as AreaType, year.yearCode),
        listRankingValues(calculation.denominatorKey, areaType as AreaType, year.yearCode),
      ]);
      if (numValues.length === 0 && numResult.success) numValues = numResult.data;
      if (denValues.length === 0 && denResult.success) denValues = denResult.data;
    }

    if (numValues.length === 0 || denValues.length === 0) {
      logger.warn({ rankingKey, yearCode: year.yearCode }, "年度別データが一部不足しているためスキップ");
      continue;
    }

    // 計算実行
    const calculated = computeCalculatedValues(numValues, denValues, {
      type: calculation.type || "ratio",
      categoryName: title,
      categoryCode: rankingKey,
      unit: unit,
    });

    if (calculated.length > 0) {
      // 順位再計算
      const computed = rankByValue(calculated) as RankingValue[];
      allYearsValues.push(...computed);

      // 最新年度のデータを保持
      if (year.yearCode === sortedCommonYears[0].yearCode) {
        latestYearValues = computed;
      }
    }
  }

  return {
    success: true,
    message: `最新年度(${sortedCommonYears[0]?.yearCode || "N/A"})のデータを含む全${sortedCommonYears.length}年度分を計算しました`,
    years: sortedCommonYears,
    latestYearValues: latestYearValues.length > 0 ? latestYearValues : undefined,
    allYearsValues: allYearsValues.length > 0 ? allYearsValues : undefined,
  };
}
