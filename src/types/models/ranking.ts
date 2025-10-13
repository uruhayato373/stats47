/**
 * ランキング値の表示用ヘルパー関数
 */
export function formatRankingValueDisplay(
  numericValue: number | undefined,
  unit: string | undefined
): string {
  if (numericValue === undefined || numericValue === null) {
    return "データなし";
  }

  const formattedValue = numericValue.toLocaleString();
  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

/**
 * ランキング値の基本情報
 * データベースのranking_valuesテーブルに対応
 */
export interface RankingValue {
  /**
   * ランキング値の一意なID
   * データベースの主キー
   */
  id: number;

  /**
   * ランキングキー（一意識別子）
   * ranking_itemsテーブルのranking_keyと関連付けられる
   */
  rankingKey: string;

  /**
   * 地域コード
   * 都道府県や市区町村を識別するコード（例: "01" = 北海道）
   */
  areaCode: string;

  /**
   * 地域名（オプショナル）
   * 地域コードに対応する地域名（例: "北海道"）
   */
  areaName?: string;

  /**
   * 時系列コード
   * 統計データの年度や期間を識別するコード（例: "2023100000" = 2023年）
   */
  timeCode: string;

  /**
   * 時系列名（オプショナル）
   * 時系列コードに対応する期間名（例: "2023年"）
   */
  timeName?: string;

  /**
   * 値（文字列）
   * e-Stat APIから取得した生の値
   */
  value: string;

  /**
   * 数値（オプショナル）
   * 計算やソート用に変換された数値
   */
  numericValue?: number;

  /**
   * 単位（オプショナル）
   * データの単位（例: "人", "千円", "%"）
   */
  unit?: string;

  /**
   * ランク（オプショナル）
   * 都道府県間での順位
   */
  rank?: number;

  /**
   * 作成日時（オプショナル）
   * レコードが作成された日時（ISO 8601形式）
   * データベースから取得時のみ設定される
   */
  createdAt?: string;

  /**
   * 更新日時（オプショナル）
   * レコードが最後に更新された日時（ISO 8601形式）
   * データベースから取得時のみ設定される
   */
  updatedAt?: string;
}

/**
 * ランキング項目の基本情報
 * データベースのranking_itemsテーブルに対応
 */
export interface RankingItem {
  /**
   * ランキング項目の一意なID
   * データベースの主キー
   */
  id: number;

  /**
   * ランキングキー（一意識別子）
   * estat_metainfoテーブルのranking_keyと関連付けられる
   */
  rankingKey: string;

  /**
   * 表示ラベル
   * UIで表示される短い名前（例: "人口密度"）
   */
  label: string;

  /**
   * 項目名
   * 統計項目の正式名称（例: "人口密度（人/km²）"）
   */
  name: string;

  /**
   * 説明（オプショナル）
   * 統計項目の詳細説明
   */
  description?: string;

  /**
   * 単位
   * データの単位（例: "人/km²", "千円", "%"）
   */
  unit: string;

  /**
   * データソースID
   * データの取得元を識別（例: "estat"）
   */
  dataSourceId: string;

  /**
   * 地図の色スキーム
   * コロプレスマップで使用する色のスキーム（例: "interpolateBlues"）
   */
  mapColorScheme: string;

  /**
   * 分岐点設定
   * 色の分岐点を設定（"zero", "mean", "median" または数値）
   */
  mapDivergingMidpoint: "zero" | "mean" | "median" | number;

  /**
   * ランキング方向
   * 昇順（"asc"）または降順（"desc"）
   */
  rankingDirection: "asc" | "desc";

  /**
   * 変換係数
   * 表示用に値を変換する際の係数（例: 1000で割る場合）
   */
  conversionFactor: number;

  /**
   * 小数点以下桁数
   * 表示時の小数点以下の桁数
   */
  decimalPlaces: number;

  /**
   * 有効フラグ
   * このランキング項目が有効かどうか
   */
  isActive: boolean;

  /**
   * 作成日時（オプショナル）
   * レコードが作成された日時（ISO 8601形式）
   * データベースから取得時のみ設定される
   */
  createdAt?: string;

  /**
   * 更新日時（オプショナル）
   * レコードが最後に更新された日時（ISO 8601形式）
   * データベースから取得時のみ設定される
   */
  updatedAt?: string;
}

/**
 * ランキングオプション（タブ項目）の構造
 * UIのタブ表示で使用される汎用的なオプション型
 */
export interface RankingOption<T extends string> {
  /**
   * オプションの一意なキー
   * タブの識別子として使用
   */
  key: T;

  /**
   * 表示用ラベル
   * タブに表示されるテキスト
   */
  label: string;
}

/**
 * データベースのランキング値型（スネークケース）
 * 実際のranking_valuesテーブル構造と完全に一致
 * データベースから直接取得した生データの型
 */
export interface RankingValueDB {
  /**
   * ランキング値の一意なID
   * データベースの主キー
   */
  id: number;

  /**
   * ランキングキー（一意識別子）
   * ranking_itemsテーブルのranking_keyと関連付けられる
   */
  ranking_key: string;

  /**
   * 地域コード
   * 都道府県や市区町村を識別するコード（例: "01" = 北海道）
   */
  area_code: string;

  /**
   * 地域名（オプショナル）
   * 地域コードに対応する地域名（例: "北海道"）
   */
  area_name?: string;

  /**
   * 時系列コード
   * 統計データの年度や期間を識別するコード（例: "2023100000" = 2023年）
   */
  time_code: string;

  /**
   * 時系列名（オプショナル）
   * 時系列コードに対応する期間名（例: "2023年"）
   */
  time_name?: string;

  /**
   * 値（文字列）
   * e-Stat APIから取得した生の値
   */
  value: string;

  /**
   * 数値（オプショナル）
   * 計算やソート用に変換された数値
   */
  numeric_value?: number;

  /**
   * 表示用値（オプショナル）
   * ユーザーに表示するための整形された値
   */
  display_value?: string;

  /**
   * ランク（オプショナル）
   * 都道府県間での順位
   */
  rank?: number;

  /**
   * 作成日時
   * レコードが作成された日時（ISO 8601形式）
   */
  created_at: string;

  /**
   * 更新日時
   * レコードが最後に更新された日時（ISO 8601形式）
   */
  updated_at: string;
}

/**
 * データベースのランキング項目型（スネークケース）
 * 実際のranking_itemsテーブル構造と完全に一致
 * データベースから直接取得した生データの型
 */
export interface RankingItemDB {
  /**
   * ランキング項目の一意なID
   * データベースの主キー
   */
  id: number;

  /**
   * ランキングキー（一意識別子）
   * estat_metainfoテーブルのranking_keyと関連付けられる
   */
  ranking_key: string;

  /**
   * 表示ラベル
   * UIで表示される短い名前（例: "人口密度"）
   */
  label: string;

  /**
   * 項目名
   * 統計項目の正式名称（例: "人口密度（人/km²）"）
   */
  name: string;

  /**
   * 説明（オプショナル）
   * 統計項目の詳細説明
   */
  description?: string;

  /**
   * 単位
   * データの単位（例: "人/km²", "千円", "%"）
   */
  unit: string;

  /**
   * データソースID
   * データの取得元を識別（例: "estat"）
   */
  data_source_id: string;

  /**
   * 地図の色スキーム
   * コロプレスマップで使用する色のスキーム（例: "interpolateBlues"）
   */
  map_color_scheme: string;

  /**
   * 分岐点設定
   * 色の分岐点を設定（"zero", "mean", "median" または数値）
   */
  map_diverging_midpoint: string;

  /**
   * ランキング方向
   * 昇順（"asc"）または降順（"desc"）
   */
  ranking_direction: string;

  /**
   * 変換係数
   * 表示用に値を変換する際の係数（例: 1000で割る場合）
   */
  conversion_factor: number;

  /**
   * 小数点以下桁数
   * 表示時の小数点以下の桁数
   */
  decimal_places: number;

  /**
   * 有効フラグ
   * このランキング項目が有効かどうか
   */
  is_active: boolean;

  /**
   * 作成日時
   * レコードが作成された日時（ISO 8601形式）
   */
  created_at: string;

  /**
   * 更新日時
   * レコードが最後に更新された日時（ISO 8601形式）
   */
  updated_at: string;
}
