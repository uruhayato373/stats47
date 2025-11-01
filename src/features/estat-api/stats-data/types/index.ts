/**
 * e-Stat統計データ共通型定義
 */

// e-Stat APIレスポンス型を再エクスポート
export * from "./stats-data-response";

/**
 * 統計データ取得オプション
 */
export interface FetchOptions {
  categoryFilter?: string;
  yearFilter?: string;
  areaFilter?: string;
  limit?: number;
}

/**
 * 動的フィールドの型定義
 */
export type DynamicField = {
  /** 一意のID（cdTime, cdCat02, cdCat03など） */
  id: string;
  /** 表示ラベル（時間軸, 分類02, 分類03など） */
  label: string;
  /** 入力値 */
  value: string;
};

/**
 * フォームデータの型定義
 */
export type FormData = {
  /** 統計表ID */
  statsDataId: string;
  /** 分類01 */
  cdCat01: string;
};

/**
 * R2に保存されるe-Stat統計データキャッシュの型定義
 */
export interface StatsDataCacheDataR2 {
  version: string; // バージョン情報
  stats_data_id: string; // 統計表ID
  saved_at: string; // 保存日時（ISO 8601）
  // e-Stat API レスポンス全体を保存
  stats_data_response: EstatStatsDataResponse;
  // 検索・フィルタ用サマリー情報
  summary: {
    table_title: string;
    stat_name: string;
    organization: string;
    survey_date: string;
    updated_date: string;
  };
}
