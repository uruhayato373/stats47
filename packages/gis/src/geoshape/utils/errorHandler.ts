/**
 * エラーハンドリングユーティリティ
 *
 * エラーのログ記録とエラーメッセージの生成を統一する。
 * 注意: logger は外部から注入される必要があるため、このパッケージでは logger に依存しない。
 * エラーメッセージの生成のみを担当する。
 */

import { collectErrorDetails } from "./errorDetailsCollector";
import { getPerformanceMeasurementString } from "./performanceMonitor";

/**
 * エラーメッセージの生成
 *
 * @param error - エラーオブジェクト
 * @param defaultMessage - デフォルトメッセージ
 * @returns エラーメッセージ
 */
export function createErrorMessage(
  error: unknown,
  defaultMessage: string
): string {
  const errorMessage =
    error instanceof Error ? error.message : "Unknown error";
  return `${defaultMessage}: ${errorMessage}`;
}

/**
 * エラー詳細情報の収集（ログ記録用）
 *
 * @param error - エラーオブジェクト
 * @param context - ログコンテキスト
 * @param startTime - パフォーマンス計測の開始時刻（オプション）
 * @returns エラー詳細情報オブジェクト
 */
export function collectErrorDetailsForLogging(
  error: unknown,
  context: Record<string, unknown>,
  startTime?: number
): Record<string, unknown> {
  const errorContext: Record<string, unknown> = {
    ...context,
  };

  if (startTime !== undefined) {
    errorContext.processingTime = getPerformanceMeasurementString(startTime);
  }

  return collectErrorDetails(error, errorContext);
}

/**
 * エラーの再スロー（エラーメッセージ生成のみ）
 *
 * @param error - エラーオブジェクト
 * @param message - エラーメッセージ
 * @param errorMessagePrefix - エラーメッセージのプレフィックス（オプション）
 * @throws 新しいエラー
 */
export function rethrowError(
  error: unknown,
  message: string,
  errorMessagePrefix?: string
): never {
  const errorMessage = errorMessagePrefix
    ? createErrorMessage(error, errorMessagePrefix)
    : createErrorMessage(error, message);

  throw new Error(errorMessage);
}
