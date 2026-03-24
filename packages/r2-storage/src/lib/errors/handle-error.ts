import { analyzeR2Error } from "./analyze-error";
import { createR2ErrorMessage } from "./create-error-message";
import { logR2Error } from "./log-error";

/**
 * R2エラーを処理して適切なエラーをthrow
 *
 * @param error - エラーオブジェクト
 * @param context - コンテキスト情報
 * @param operation - 操作名
 * @throws {Error} 適切なエラーメッセージを含むErrorオブジェクト
 */
export function handleR2Error(
  error: unknown,
  context: { key?: string; bucketName?: string; size?: number },
  operation: string = "操作"
): never {
  const errorInfo = analyzeR2Error(error);
  const logContext: Record<string, unknown> = {
    ...context,
    errorStack: error instanceof Error ? error.stack : undefined,
  };

  // エラータイプに応じたログメッセージ
  let logMessage: string;
  if (errorInfo.isAuthError) {
    logMessage = `R2ストレージへの${operation}で認証エラーが発生しました`;
  } else if (errorInfo.isNotFoundError) {
    logMessage = `R2ストレージへの${operation}でバケットが見つかりませんでした`;
  } else if (errorInfo.isNetworkError) {
    logMessage = `R2ストレージへの${operation}でネットワークエラーが発生しました`;
  } else {
    logMessage = `R2ストレージへの${operation}に失敗しました`;
  }

  logR2Error(errorInfo, logContext, logMessage);

  // エラーメッセージを生成してthrow
  const errorMessage = createR2ErrorMessage(errorInfo, context, operation);
  throw new Error(errorMessage);
}
