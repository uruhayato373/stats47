/**
 * R2に保存されるe-Statメタ情報キャッシュの型定義
 */

/**
 * R2保存用のメタ情報データ
 */
export interface MetaInfoCacheDataR2 {
  version: string; // バージョン情報
  stats_data_id: string; // 統計表ID
  saved_at: string; // 保存日時（ISO 8601）

  // e-Stat API レスポンス全体を保存
  meta_info_response: Record<string, any>;

  // 検索・フィルタ用サマリー情報
  summary: {
    table_title: string;
    stat_name: string;
    organization: string;
    survey_date: string | number;
    updated_date: string;
  };
}

/**
 * R2保存APIのリクエストボディ
 */
export interface SaveMetaInfoCacheRequest {
  statsDataId: string;
  metaInfoResponse: Record<string, any>;
}

/**
 * R2保存APIのレスポンス
 */
export interface SaveMetaInfoCacheResponse {
  success: boolean;
  message: string;
  data?: {
    key: string; // R2オブジェクトキー
    size: number; // ファイルサイズ（bytes）
    statsDataId: string;
  };
  error?: string;
}
