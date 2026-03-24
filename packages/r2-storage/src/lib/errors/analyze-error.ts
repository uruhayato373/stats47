import type { R2ErrorInfo } from "./types";

/**
 * R2エラーを分析してエラー情報を取得
 *
 * @param error - エラーオブジェクト
 * @returns エラー情報
 */
export function analyzeR2Error(error: unknown): R2ErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : "UnknownError";

  // AWS SDKのエラーコードを取得（存在する場合）
  const errorCode = (error as { Code?: string })?.Code;
  const httpStatusCode = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;

  // 認証エラーの判定
  const isAuthError =
    errorName === "Unauthorized" ||
    errorCode === "AccessDenied" ||
    errorCode === "Forbidden" ||
    errorMessage.includes("403") ||
    errorMessage.includes("Forbidden") ||
    errorMessage.includes("Unauthorized") ||
    errorMessage.includes("Access Denied") ||
    httpStatusCode === 403;

  // バケット/オブジェクト未検出エラーの判定
  const isNotFoundError =
    errorName === "NotFound" ||
    errorName === "NoSuchBucket" ||
    errorName === "NoSuchKey" ||
    errorCode === "NoSuchBucket" ||
    errorCode === "NoSuchKey" ||
    errorCode === "NotFound" ||
    errorMessage.includes("404") ||
    errorMessage.includes("Not Found") ||
    errorMessage.includes("NoSuchBucket") ||
    errorMessage.includes("NoSuchKey") ||
    errorMessage.includes("not found") ||
    httpStatusCode === 404;

  // ネットワークエラーの判定
  const isNetworkError =
    errorMessage.includes("ECONNREFUSED") ||
    errorMessage.includes("ETIMEDOUT") ||
    errorMessage.includes("network") ||
    errorMessage.includes("timeout");

  return {
    isAuthError,
    isNotFoundError,
    isNetworkError,
    errorMessage,
    errorName,
    errorCode,
    httpStatusCode,
  };
}
