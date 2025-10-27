/**
 * e-Stat API関連の共通型定義
 */

import { AreaType } from "@/features/area";

// e-Stat APIレスポンス型を再エクスポート
// core/types で使用されるため、ここから再エクスポート
export * from "./meta-info-response";

/**
 * e-Statメタ情報の型定義
 */
export interface EstatMetaInfo {
  stats_data_id: string;
  stat_name: string;
  title: string;
  area_type: AreaType;
  cycle?: string;
  survey_date?: string;
  description?: string;
  last_fetched_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * 自動保存ステータスの型定義
 */
export interface AutoSaveStatus {
  type: "success" | "error" | null;
  message: string;
}
