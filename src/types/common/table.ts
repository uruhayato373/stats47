/**
 * 共通の型定義
 */

/**
 * ソートフィールドの型
 */
export type SortField = "rank" | "prefecture" | "value";

/**
 * ソート方向の型
 */
export type SortDirection = "asc" | "desc";

/**
 * テーブルのソート状態
 */
export interface SortState {
  field: SortField;
  direction: SortDirection;
}
