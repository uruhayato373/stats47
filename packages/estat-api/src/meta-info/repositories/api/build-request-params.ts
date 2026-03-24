import { ESTAT_API, ESTAT_APP_ID } from "../../../core";

/**
 * e-Stat APIリクエストパラメータを構築
 */
export function buildRequestParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  return {
    appId: ESTAT_APP_ID,
    lang: ESTAT_API.DEFAULT_LANG,
    dataFormat: ESTAT_API.DATA_FORMAT,
    ...params,
  };
}
