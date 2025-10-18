/**
 * モデル型定義の集約エクスポート
 */

export * from "./user";
export * from "./ranking";

// e-Stat メタデータ関連の型定義
export interface SavedMetadataItem {
  id: number;
  stats_data_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
