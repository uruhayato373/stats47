/**
 * エラー詳細情報収集ユーティリティ
 *
 * エラー発生時に詳細な情報を収集し、ログ記録用のオブジェクトを生成する。
 */

/**
 * エラー詳細情報の収集
 *
 * @param error - エラーオブジェクト
 * @param additionalContext - 追加のコンテキスト情報
 * @returns エラー詳細情報オブジェクト
 */
export function collectErrorDetails(
  error: unknown,
  additionalContext: Record<string, unknown> = {}
): Record<string, unknown> {
  const errorDetails: Record<string, unknown> = {
    ...additionalContext,
    error: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
    errorName: error instanceof Error ? error.name : "UnknownError",
  };

  // 環境情報を追加（デバッグ用）
  if (typeof process !== "undefined" && process.env) {
    errorDetails.env = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
      hasR2PublicUrl: !!process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
      hasNextPublicR2GeoshapeUrl: !!process.env.NEXT_PUBLIC_R2_GEOSHAPE_URL,
    };
  }

  return errorDetails;
}
