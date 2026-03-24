/**
 * e-Stat API 共通エラークラス
 */

/**
 * e-Stat API エラーの基底クラス
 */
export class EstatError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown,
    public statusCode?: number
  ) {
    super(message);
    this.name = "EstatError";
  }
}

/**
 * e-Stat API 通信エラー
 */
export class EstatApiError extends EstatError {
  constructor(
    message: string,
    code: string = "API_ERROR",
    originalError?: unknown,
    statusCode?: number
  ) {
    super(message, code, originalError, statusCode);
    this.name = "EstatApiError";
  }
}
