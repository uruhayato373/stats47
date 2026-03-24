/**
 * R2エラー情報
 */
export interface R2ErrorInfo {
  /** 認証エラーかどうか */
  isAuthError: boolean;
  /** バケット/オブジェクト未検出エラーかどうか */
  isNotFoundError: boolean;
  /** ネットワークエラーかどうか */
  isNetworkError: boolean;
  /** エラーメッセージ */
  errorMessage: string;
  /** エラー名 */
  errorName: string;
  /** エラーコード（AWS SDKの場合） */
  errorCode?: string;
  /** HTTPステータスコード */
  httpStatusCode?: number;
}
