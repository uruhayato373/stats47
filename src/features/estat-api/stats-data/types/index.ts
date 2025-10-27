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
