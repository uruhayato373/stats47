import { logger } from "@stats47/logger/server";
import { findRankingItemByKey } from "../repositories/ranking-item";
import { listRankingValues } from "../repositories/ranking-value";
import type { AreaType } from "@stats47/types";
import type { RankingItem, RankingValue } from "../types";
import { computeCalculatedValues } from "../utils/compute-calculated-values";
import { rankByValue } from "../utils/rank-by-value";

/**
 * 計算によってランキングデータを生成する
 */
export async function calculateRankingValues(
  rankingItem: RankingItem,
  yearCode: string,
  visited?: Set<string>
): Promise<RankingValue[]> {
  const { rankingKey, calculation } = rankingItem;

  const key = `${rankingKey}:${yearCode}`;
  if (visited?.has(key)) {
    logger.warn({ key }, "calculateRankingValues: 循環参照を検出");
    return [];
  }
  const nextVisited = new Set(visited);
  nextVisited.add(key);

  if (!calculation?.isCalculated || !calculation.type) {
    return [];
  }

  logger.info(
    { rankingKey, type: calculation.type, yearCode },
    "calculateRankingValues: 計算開始"
  );

  try {
    if (calculation.type === "per_capita") {
        return await calculatePerCapita(rankingItem, yearCode, nextVisited);
    } else if (calculation.type === "ratio") {
        return await calculateRatio(rankingItem, yearCode, nextVisited);
    }

    return [];
  } catch (error) {
    logger.error(
      { error, rankingKey, yearCode },
      "calculateRankingValues: 計算失敗"
    );
    return [];
  }
}

/**
 * 人口あたり計算 (per_capita)
 * 分子: numeratorRankingKey
 * 分母: 人口 (population-total) - ハードコードまたは設定で指定可能にすべきだが一旦固定
 */
async function calculatePerCapita(
  rankingItem: RankingItem,
  yearCode: string,
  visited: Set<string>
): Promise<RankingValue[]> {
    const { calculation, rankingKey } = rankingItem;
    const numeratorKey = calculation?.numeratorKey;

    // デフォルトの人口ランキングキー（総人口）
    const populationKey = "total-population";

    if (!numeratorKey) {
        logger.warn({ rankingKey }, "calculatePerCapita: 分子キーが設定されていません");
        return [];
    }

    const numeratorValues = await getValues(numeratorKey, yearCode, visited);
    const denominatorValues = await getValues(populationKey, yearCode, visited);

    if (numeratorValues.length === 0 || denominatorValues.length === 0) {
        logger.warn({ rankingKey, yearCode }, "calculatePerCapita: データ不足のため計算不可");
        return [];
    }

    const computed = computeCalculatedValues(numeratorValues, denominatorValues, {
        type: "per_capita",
        categoryCode: rankingKey,
        categoryName: rankingItem.title,
        unit: rankingItem.unit,
        keyBy: "areaCode",
    });
    return rankByValue(computed) as RankingValue[];
}

/**
 * 比率計算 (ratio)
 * 分子: numeratorRankingKey
 * 分母: denominatorRankingKey
 */
async function calculateRatio(
  rankingItem: RankingItem,
  yearCode: string,
  visited: Set<string>
): Promise<RankingValue[]> {
    const { calculation, rankingKey } = rankingItem;
    const numeratorKey = calculation?.numeratorKey;
    const denominatorKey = calculation?.denominatorKey;

    if (!numeratorKey || !denominatorKey) {
        logger.warn({ rankingKey }, "calculateRatio: 分子または分母キーが設定されていません");
        return [];
    }

    const numeratorValues = await getValues(numeratorKey, yearCode, visited);
    const denominatorValues = await getValues(denominatorKey, yearCode, visited);

    if (numeratorValues.length === 0 || denominatorValues.length === 0) {
        logger.warn({ rankingKey, yearCode }, "calculateRatio: データ不足のため計算不可");
        return [];
    }

    const computed = computeCalculatedValues(numeratorValues, denominatorValues, {
        type: "ratio",
        categoryCode: rankingKey,
        categoryName: rankingItem.title,
        unit: rankingItem.unit,
        keyBy: "areaCode",
    });
    return rankByValue(computed) as RankingValue[];
}

/**
 * データの取得ヘルパー
 * DB から取得する。計算型アイテムの場合は再帰的に計算する。
 */
async function getValues(
    key: string,
    yearCode: string,
    visited: Set<string>
): Promise<RankingValue[]> {
    // 1. DBから検索
    const result = await listRankingValues(key, "prefecture" as AreaType, yearCode);
    if (result.success && result.data.length > 0) {
        return result.data;
    }

    // 2. DB にない場合、計算型アイテムなら再帰的に計算する
    const itemResult = await findRankingItemByKey(key);
    if (!itemResult.success || !itemResult.data) {
        return [];
    }

    const item = itemResult.data;

    if (item.calculation?.isCalculated) {
        return calculateRankingValues(item, yearCode, visited);
    }

    // 非計算型: e-Stat API からオンデマンド取得 + キャッシュ
    const { fetchRankingValuesFromSource, cacheRankingValues } =
        await import("./fetch-ranking-values-on-demand");
    const values = await fetchRankingValuesFromSource(item, yearCode);
    if (values.length > 0) {
        await cacheRankingValues(item, yearCode, values);
    }
    return values;
}
