import { ESTAT_API, ESTAT_ENDPOINTS, executeHttpRequest, executeWithRetry } from "../../../core";
import type { EstatMetaInfoResponse } from "../../types";
import { buildRequestParams } from "./build-request-params";
import { validateResponse } from "./validate-response";

/**
 * e-Stat APIからメタ情報を取得
 */
export async function fetchMetaInfoFromApi(
  statsDataId: string
): Promise<EstatMetaInfoResponse> {
  const requestParams = buildRequestParams({ statsDataId });

  const response = await executeWithRetry(
    () =>
      executeHttpRequest<EstatMetaInfoResponse>(
        ESTAT_API.BASE_URL,
        ESTAT_ENDPOINTS.GET_META_INFO,
        requestParams,
        30000
      ),
    { maxRetries: 3, initialDelay: 1000 }
  );

  validateResponse(response);
  return response;
}
