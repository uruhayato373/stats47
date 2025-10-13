/**
 * ランキング値の基本情報
 * データベースのranking_valuesテーブルに対応
 */
export interface RankingValue {
  /** ランキング値のID */
  id: number;

  /** ランキングキー（一意識別子） */
  rankingKey: string;

  /** 地域コード */
  areaCode: string;

  /** 地域名（オプショナル） */
  areaName?: string;

  /** 時系列コード */
  timeCode: string;

  /** 時系列名（オプショナル） */
  timeName?: string;

  /** 値（文字列） */
  value: string;

  /** 数値（オプショナル） */
  numericValue?: number;

  /** 表示用値（オプショナル） */
  displayValue?: string;

  /** ランク（オプショナル） */
  rank?: number;

  /** 作成日時 */
  createdAt: string;

  /** 更新日時 */
  updatedAt: string;
}

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
 * データベースのランキング値型（スネークケース）
 * 実際のranking_valuesテーブル構造と完全に一致
 */
export interface RankingValueDB {
  id: number;
  ranking_key: string;
  area_code: string;
  area_name?: string;
  time_code: string;
  time_name?: string;
  value: string;
  numeric_value?: number;
  display_value?: string;
  rank?: number;
  created_at: string;
  updated_at: string;
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
