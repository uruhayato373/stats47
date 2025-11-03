/**
 * フォーマットユーティリティ
 *
 * 数値や文字列のフォーマット処理を提供。
 * アプリケーション全体で使用するフォーマット関数の一元管理。
 *
 * @module lib/format
 */

/**
 * 数値をカンマ区切りでフォーマット
 *
 * 日本語ロケールを使用して、数値をカンマ区切りの文字列に変換する。
 *
 * @param value - フォーマットする数値
 * @returns フォーマットされた文字列（例: "1,234,567"）
 *
 * @example
 * ```typescript
 * formatNumber(1234567); // "1,234,567"
 * formatNumber(1000); // "1,000"
 * formatNumber(123); // "123"
 * ```
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ja-JP").format(value);
}

