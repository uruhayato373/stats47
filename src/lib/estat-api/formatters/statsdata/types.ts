/**
 * e-Stat統計データフォーマッター共通型定義
 */

/**
 * 統計データ取得オプション
 */
export interface FetchOptions {
  categoryFilter?: string;
  yearFilter?: string;
  areaFilter?: string;
  limit?: number;
}
