import { ESTAT_API, ESTAT_ENDPOINTS, executeHttpRequest, executeWithRetry } from "../../../core";
import type { EstatStatsDataResponse, GetStatsDataParams } from "../../types";
import { buildRequestParams } from "./build-request-params";
import { validateResponse } from "./validate-response";

/**
 * e-Stat APIから統計データを取得
 *
 * @param params - e-Stat APIパラメータ
 * @returns 統計データレスポンス
 */
export async function fetchStatsDataFromApi(
  params: GetStatsDataParams
): Promise<EstatStatsDataResponse> {
  const requestBody = {
    ...params,
    metaGetFlg: params.metaGetFlg ?? "Y",
    cntGetFlg: params.cntGetFlg ?? "N",
    explanationGetFlg: params.explanationGetFlg ?? "N",
    annotationGetFlg: params.annotationGetFlg ?? "N",
    replaceSpChars: params.replaceSpChars ?? "0",
  };

  const requestParams = buildRequestParams(requestBody);
  const url = `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_STATS_DATA}`;

  // リトライ付きでAPI呼び出し
  const response = await executeWithRetry(
    () =>
      executeHttpRequest<EstatStatsDataResponse>(
        ESTAT_API.BASE_URL,
        ESTAT_ENDPOINTS.GET_STATS_DATA,
        requestParams,
        120000,
        {
          revalidate: 3600,
          tags: [`estat-stats-data-${params.statsDataId}`],
        }
      ),
    {
      maxRetries: 3,
      initialDelay: 1000,
    }
  );

  validateResponse(response, url);

  return response;
}
