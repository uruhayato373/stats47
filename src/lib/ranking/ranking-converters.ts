/**
 * ランキング関連のデータ変換ヘルパー関数
 *
 * 目的:
 * - データベース型からアプリケーション型への変換
 * - 型安全性の確保
 * - 変換ロジックの一元管理
 */

import {
  RankingItem,
  RankingItemDB,
  RankingValue,
  RankingValueDB,
} from "@/lib/ranking/types";

/**
 * データベース型からアプリケーション型への変換ヘルパー関数（ランキング項目）
 */
export function convertRankingItemFromDB(dbItem: RankingItemDB): RankingItem {
  return {
    rankingKey: dbItem.ranking_key,
    label: dbItem.label,
    name: dbItem.name,
    description: dbItem.description,
    unit: dbItem.unit,
    dataSourceId: dbItem.data_source_id,
    mapColorScheme: dbItem.map_color_scheme,
    mapDivergingMidpoint: dbItem.map_diverging_midpoint as
      | "zero"
      | "mean"
      | "median",
    rankingDirection: dbItem.ranking_direction as "asc" | "desc",
    conversionFactor: dbItem.conversion_factor,
    decimalPlaces: dbItem.decimal_places,
    isActive: dbItem.is_active,
  };
}

/**
 * データベース型からアプリケーション型への変換ヘルパー関数（ランキング値）
 */
export function convertRankingValueFromDB(
  dbValue: RankingValueDB
): RankingValue {
  return {
    rankingKey: dbValue.ranking_key,
    areaCode: dbValue.area_code,
    areaName: dbValue.area_name,
    timeCode: dbValue.time_code,
    timeName: dbValue.time_name,
    value: dbValue.value,
    unit: dbValue.unit,
    rank: dbValue.rank,
  };
}
