import { logger } from "@stats47/logger";
import type { R2ErrorInfo } from "./types";

/**
 * R2エラーのログを出力
 *
 * @param errorInfo - エラー情報
 * @param context - コンテキスト情報（errorStackを含む可能性がある）
 * @param message - ログメッセージ
 */
export function logR2Error(
  errorInfo: R2ErrorInfo,
  context: Record<string, unknown>,
  message: string
): void {
  const { errorMessage, errorName, errorCode, httpStatusCode } = errorInfo;

  const logContext: Record<string, unknown> = {
    ...context,
    error: errorMessage,
    errorName,
    errorCode,
    httpStatusCode,
  };

  // エラータイプに応じた提案を追加
  if (errorInfo.isAuthError) {
    logContext.suggestion = [
      "R2バインディングが正しく設定されているか確認してください。",
      "R2 APIトークンに「Object Read & Write」権限があるか確認してください。",
      "バケット名（CLOUDFLARE_R2_BUCKET_NAME）が正しいか確認してください。",
    ].join(" ");
  } else if (errorInfo.isNotFoundError) {
    logContext.suggestion = "バケットが存在しないか、アクセス権限がありません。バケット名（CLOUDFLARE_R2_BUCKET_NAME）が正しいか確認してください。";
  } else if (errorInfo.isNetworkError) {
    logContext.suggestion = "ネットワーク接続に問題がある可能性があります。プロキシ設定（HTTPS_PROXY, HTTP_PROXY）を確認してください。";
  }

  logger.error(logContext, message);
}
