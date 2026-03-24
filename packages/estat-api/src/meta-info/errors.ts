/**
 * メタ情報ドメイン固有のエラークラス
 */

import { EstatApiError } from "../core/errors";

/**
 * メタ情報取得エラー
 */
export class EstatMetaInfoFetchError extends EstatApiError {
  constructor(
    message: string,
    public statsDataId: string,
    originalError?: unknown
  ) {
    super(message, "META_INFO_FETCH_ERROR", originalError);
    this.name = "EstatMetaInfoFetchError";
  }
}
