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
} from "@/types/models/ranking";

/**
 * データベース型からアプリケーション型への変換ヘルパー関数（ランキング項目）
 */
export function convertRankingItemFromDB(dbItem: RankingItemDB): RankingItem {
  return {
    id: dbItem.id,
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
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at,
  };
}

/**
 * データベース型からアプリケーション型への変換ヘルパー関数（ランキング値）
 */
export function convertRankingValueFromDB(
  dbValue: RankingValueDB
): RankingValue {
  return {
    id: dbValue.id,
    rankingKey: dbValue.ranking_key,
    areaCode: dbValue.area_code,
    areaName: dbValue.area_name,
    timeCode: dbValue.time_code,
    timeName: dbValue.time_name,
    value: dbValue.value,
    numericValue: dbValue.numeric_value,
    displayValue: dbValue.display_value,
    rank: dbValue.rank,
    createdAt: dbValue.created_at,
    updatedAt: dbValue.updated_at,
  };
}
