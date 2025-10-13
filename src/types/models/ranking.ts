/**
 * ランキング項目の基本情報
 * データベースのranking_itemsテーブルに対応
 */
export interface RankingItem {
  /** ランキング項目のID */
  id: number;

  /** ランキングキー（一意識別子） */
  rankingKey: string;

  /** 表示ラベル */
  label: string;

  /** 項目名 */
  name: string;

  /** 説明（オプショナル） */
  description?: string;

  /** 単位 */
  unit: string;

  /** データソースID */
  dataSourceId: string;

  /** 地図の色スキーム */
  mapColorScheme: string;

  /** 分岐点設定 */
  mapDivergingMidpoint: "zero" | "mean" | "median" | number;

  /** ランキング方向 */
  rankingDirection: "asc" | "desc";

  /** 変換係数 */
  conversionFactor: number;

  /** 小数点以下桁数 */
  decimalPlaces: number;

  /** 有効フラグ */
  isActive: boolean;

  /** 作成日時 */
  createdAt: string;

  /** 更新日時 */
  updatedAt: string;
}

/**
 * ランキングオプション（タブ項目）の構造
 */
export interface RankingOption<T extends string> {
  key: T;
  label: string;
}

/**
 * データベースのランキング項目型（スネークケース）
 * 実際のranking_itemsテーブル構造と完全に一致
 */
export interface RankingItemDB {
  id: number;
  ranking_key: string;
  label: string;
  name: string;
  description?: string;
  unit: string;
  data_source_id: string;
  map_color_scheme: string;
  map_diverging_midpoint: string;
  ranking_direction: string;
  conversion_factor: number;
  decimal_places: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * データベース型からアプリケーション型への変換ヘルパー関数
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
