import type { R2ErrorInfo } from "./types";

/**
 * R2エラーメッセージを生成
 *
 * @param errorInfo - エラー情報
 * @param context - コンテキスト情報（key, bucketName等）
 * @param operation - 操作名（例: "保存", "取得", "削除"）
 * @returns エラーメッセージ
 */
export function createR2ErrorMessage(
  errorInfo: R2ErrorInfo,
  context: { key?: string; bucketName?: string },
  operation: string = "操作"
): string {
  const { key, bucketName } = context;
  const { errorMessage, errorName, errorCode } = errorInfo;

  if (errorInfo.isAuthError) {
    return `R2ストレージへの${operation}に失敗しました: 認証エラー（${errorCode || errorName}）。R2ストレージの認証情報が正しく設定されているか、有効な権限があるか確認してください。エラー詳細: ${errorMessage}`;
  }

  if (errorInfo.isNotFoundError) {
    const bucketInfo = bucketName ? `バケット "${bucketName}"` : "バケット";
    return `R2ストレージへの${operation}に失敗しました: ${bucketInfo}が存在しないか、アクセス権限がありません。バケット名が正しいか確認してください。エラー詳細: ${errorMessage}`;
  }

  if (errorInfo.isNetworkError) {
    return `R2ストレージへの${operation}に失敗しました: ネットワークエラー。ネットワーク接続を確認してください。エラー詳細: ${errorMessage}`;
  }

  return `R2ストレージへの${operation}に失敗しました: ${errorMessage}`;
}
