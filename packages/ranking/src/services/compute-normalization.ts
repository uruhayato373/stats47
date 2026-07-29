import { logger } from "@stats47/logger/server";
import type { AreaType } from "@stats47/types";
import { readRankingItemByKeyFromR2 } from "../repositories/ranking-item";
import { listRankingValues } from "../repositories/ranking-value";
import type { RankingItem, RankingValue } from "../types";

import { applyNormalization, resolveDenominator } from "./normalize-core";

// 計算コア・分母宣言は normalize-core.ts が単一ソース (writer と共有)。
// ここから re-export して既存 import 元 (テスト等) の互換を保つ。
export {
  WELL_KNOWN_DENOMINATORS,
  resolveDenominator,
  applyNormalization,
  type WellKnownDenominator,
} from "./normalize-core";

/**
 * 指標データに対して正規化計算を適用する
 */
export async function computeNormalization(
  rankingItem: RankingItem,
  yearCode: string,
  normalizationType: string,
): Promise<RankingValue[]> {
  const { rankingKey, areaType, calculation } = rankingItem;

  const option = calculation?.normalizationOptions?.find(opt => opt.type === normalizationType);
  if (!option) {
    logger.warn({ rankingKey, normalizationType }, "computeNormalization: 正規化オプションが見つかりません");
    return [];
  }

  // 分母キー + 単位換算係数の解決 (writer と共通の normalize-core が決める)
  const denominator = resolveDenominator(option.type, areaType, option.denominatorKey);

  if (!denominator) {
    logger.warn({ rankingKey, type: option.type, areaType }, "computeNormalization: 分母キーを特定できません");
    return [];
  }
  const denominatorKey = denominator.key;

  // 1. 分子データの取得（DB → なければオンデマンド取得）
  const numeratorResult = await listRankingValues(rankingKey, areaType as AreaType, yearCode);
  let numeratorValues = numeratorResult.success ? numeratorResult.data : [];

  if (numeratorValues.length === 0) {
    const { fetchRankingValuesOnDemand } = await import("./fetch-ranking-values-on-demand");
    numeratorValues = await fetchRankingValuesOnDemand(rankingItem, yearCode);
  }

  // 2. 分母データの取得（DB → なければオンデマンド取得）
  const denominatorValues = await getDenominatorValues(denominatorKey, areaType, yearCode);

  if (numeratorValues.length === 0 || denominatorValues.length === 0) {
    logger.warn({ rankingKey, denominatorKey, yearCode }, "computeNormalization: データ不足のため計算不可");
    return [];
  }

  // 3. 計算実行 (単位換算 → 除算 → rank は normalize-core が一手に担う)
  return applyNormalization(numeratorValues, denominatorValues, {
    metricKey: rankingItem.rankingKey,
    unit: option.unit,
    scaleFactor: option.scaleFactor,
    valueScaleToBaseUnit: denominator.valueScaleToBaseUnit,
  });
}

/**
 * 分母データを取得するヘルパー
 *
 * 指定された yearCode でデータが見つからない場合、分母アイテムの最新年度で再取得を試みる。
 * これにより、分子と分母のデータ年度が異なる場合にも正規化が可能になる。
 */
async function getDenominatorValues(
  key: string,
  areaType: string,
  yearCode: string,
): Promise<RankingValue[]> {
  // 1. 指定された yearCode で取得を試みる
  const result = await listRankingValues(key, areaType as AreaType, yearCode);
  if (result.success && result.data.length > 0) {
    return result.data;
  }

  // 2. 分母アイテム情報を取得
  const itemResult = await readRankingItemByKeyFromR2(key);
  if (!itemResult.success || !itemResult.data) {
    return [];
  }

  // 3. 分母アイテムの最新年度で再取得を試みる（年度ミスマッチ対応）
  const denomItem = itemResult.data;
  const latestYearCode = denomItem.latestYear?.yearCode;
  if (latestYearCode && latestYearCode !== yearCode) {
    logger.info(
      { key, requestedYear: yearCode, fallbackYear: latestYearCode },
      "computeNormalization: 分母データの年度が異なるため、最新年度でフォールバック取得"
    );
    const fallbackResult = await listRankingValues(key, areaType as AreaType, latestYearCode);
    if (fallbackResult.success && fallbackResult.data.length > 0) {
      return fallbackResult.data;
    }
  }

  // 4. DB にない場合、e-Stat API からオンデマンド取得
  const { fetchRankingValuesOnDemand } = await import("./fetch-ranking-values-on-demand");
  return fetchRankingValuesOnDemand(denomItem, yearCode);
}
