/**
 * ランキング値の基本情報
 * データベースのranking_valuesテーブルに対応
 */
export interface RankingValue {
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
   * 値（数値）
   * 計算やソート用に変換された数値
   */
  value: number;

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
}

/**
 * ランキング項目の基本情報
 * データベースのranking_itemsテーブルに対応
 */
export interface RankingItem {
  /**
   * ランキングキー（一意識別子の一部）
   * estat_metainfoテーブルのranking_keyと関連付けられる
   */
  rankingKey: string;

  /**
   * 地域タイプ（一意識別子の一部）
   * 'prefecture' | 'city' | 'national'
   * ranking_keyとarea_typeの組み合わせが1意のキー
   */
  areaType: "prefecture" | "city" | "national";

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
   * 注釈（オプショナル）
   * 統計項目の詳細説明や注釈
   */
  annotation?: string;

  /**
   * 単位
   * データの単位（例: "人/km²", "千円", "%"）
   */
  unit: string;

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
   * ランキンググループキー
   * この項目が属するランキンググループ（オプショナル）
   */
  groupKey?: string;

  /**
   * グループ内での表示順
   * グループ内での表示順序
   */
  displayOrderInGroup: number;

}

/**
 * データベースのランキング値型（スネークケース）
 * @deprecated ranking_valuesテーブルは使用しません。R2ストレージを使用してください。
 * ランキング値データは R2 Storage に JSON 形式で保存されます。
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
   * 値（数値）
   * 計算やソート用に変換された数値
   */
  value: number;

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
   * ランキングキー（一意識別子・複合主キーの一部）
   * データベースの複合主キーとして使用
   */
  ranking_key: string;

  /**
   * 地域タイプ（一意識別子・複合主キーの一部）
   * 'prefecture' | 'city' | 'national'
   * ranking_keyとarea_typeの組み合わせが複合主キー
   */
  area_type: string;

  /**
   * 表示ラベル
   * UIで表示される短い名前（例: "人口密度"）
   */
  label: string;

  /**
   * ランキング名
   * 統計項目の正式名称（例: "人口密度（人/km²）"）
   */
  ranking_name: string;

  /**
   * 注釈（オプショナル）
   * 統計項目の詳細説明や注釈
   */
  annotation?: string;

  /**
   * 単位
   * データの単位（例: "人/km²", "千円", "%"）
   */
  unit: string;

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
   * ランキンググループキー
   * この項目が属するランキンググループ（オプショナル）
   */
  group_key: string | null;

  /**
   * グループ内での表示順
   * グループ内での表示順序
   */
  display_order_in_group: number;

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

