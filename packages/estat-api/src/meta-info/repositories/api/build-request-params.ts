import { ESTAT_API, resolveEstatAppId } from "../../../ingest";
const appIdFromEnv = resolveEstatAppId(process.env, false);

/**
 * e-Stat APIリクエストパラメータを構築
 */
export function buildRequestParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  return {
    appId: appIdFromEnv,
    lang: ESTAT_API.DEFAULT_LANG,
    dataFormat: ESTAT_API.DATA_FORMAT,
    ...params,
  };
}
