/**
 * データベース管理画面の環境型定義
 */

/**
 * 有効な環境値の定義
 */
export const VALID_ENVIRONMENTS = ["local", "production"] as const;

/**
 * 環境型
 */
export type Environment = (typeof VALID_ENVIRONMENTS)[number];
