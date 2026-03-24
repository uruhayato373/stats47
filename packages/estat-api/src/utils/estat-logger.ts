import { logger } from "@stats47/logger";
import type { EstatLogContext, EstatErrorHandlingOptions } from "./types";

/**
 * データ取得開始のログを出力
 *
 * @param options - エラーハンドリングオプション
 * @param context - ログコンテキスト
 */
export function logEstatDataFetchStart(
  options: EstatErrorHandlingOptions,
  context: EstatLogContext
): void {
  if (!options.enableLogging) {
    return;
  }

  logger.debug(
    {
      statsDataId: context.statsDataId,
      categoryFilter: context.categoryFilter,
      areaCode: context.areaCode,
      title: context.title,
    },
    `${options.componentName}: データ取得開始`
  );
}

/**
 * データ取得完了のログを出力
 *
 * @param options - エラーハンドリングオプション
 * @param context - ログコンテキスト
 * @param dataCount - 取得したデータ件数
 */
export function logEstatDataFetchComplete(
  options: EstatErrorHandlingOptions,
  context: EstatLogContext,
  dataCount?: number
): void {
  if (!options.enableLogging) {
    return;
  }

  logger.debug(
    {
      statsDataId: context.statsDataId,
      categoryFilter: context.categoryFilter,
      areaCode: context.areaCode,
      title: context.title,
      dataCount,
    },
    `${options.componentName}: データ取得完了`
  );
}



/**
 * エラーログを出力
 *
 * @param options - エラーハンドリングオプション
 * @param context - ログコンテキスト
 * @param error - エラーオブジェクト
 */
export function logEstatError(
  options: EstatErrorHandlingOptions,
  context: EstatLogContext,
  error: unknown
): void {
  if (!options.enableLogging) {
    return;
  }

  logger.error(
    {
      statsDataId: context.statsDataId,
      categoryFilter: context.categoryFilter,
      areaCode: context.areaCode,
      title: context.title,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    },
    `${options.componentName}: データ取得エラー`
  );
}
