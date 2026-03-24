import { logger } from "@stats47/logger";

/**
 * R2操作のエラーをハンドリング
 * 
 * @param error - エラーオブジェクト
 * @param context - コンテキスト情報（キー、サイズなど）
 * @param operation - 操作名
 */
export function handleR2Error(
  error: unknown,
  context: Record<string, any>,
  operation: string
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(
    {
      ...context,
      operation,
      error: errorMessage,
      errorStack,
    },
    `R2操作（${operation}）中にエラーが発生しました`
  );
}
