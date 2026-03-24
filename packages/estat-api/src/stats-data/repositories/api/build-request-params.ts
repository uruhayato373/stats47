import { ESTAT_API, ESTAT_APP_ID } from "../../../core/config";

/**
 * e-Stat API リクエストパラメータを構築
 *
 * @param params - 個別のパラメータ
 * @param appId - アプリケーションID (省略時はconfigから取得)
 * @returns 共通パラメータを含むパラメータオブジェクト
 */
export function buildRequestParams(
  params: Record<string, unknown>,
  appId: string = ESTAT_APP_ID
): Record<string, unknown> {
  return {
    appId,
    lang: ESTAT_API.DEFAULT_LANG,
    dataFormat: ESTAT_API.DATA_FORMAT,
    ...params,
  };
}
