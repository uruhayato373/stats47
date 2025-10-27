/**
 * e-STATメタ情報取得ユーティリティ
 * 責務: API通信とエラーハンドリング
 */

import { executeHttpRequest } from "@/features/estat-api/core/client/http-client";
import {
  ESTAT_API,
  ESTAT_APP_ID,
  ESTAT_ENDPOINTS,
} from "@/features/estat-api/core/constants";
import { EstatMetaInfoFetchError } from "@/features/estat-api/core/errors";
import {
  EstatMetaInfoResponse,
  GetMetaInfoParams,
  TransformedMetadataEntry,
} from "@/features/estat-api/core/types";

import { extractCategories } from "./formatter";

/**
 * リクエストパラメータを構築
 *
 * @param params - 追加パラメータ
 * @param appId - アプリケーションID
 * @returns 完全なリクエストパラメータ
 */
function composeRequestParams(
  params: Record<string, unknown>,
  appId: string
): Record<string, unknown> {
  return {
    appId,
    lang: ESTAT_API.DEFAULT_LANG,
    dataFormat: ESTAT_API.DATA_FORMAT,
    ...params,
  };
}

/**
 * e-Stat APIのメタ情報レスポンスを検証し、エラーの場合にthrow
 *
 * @param data - e-Stat APIのレスポンスデータ
 * @param url - リクエストURL（エラー詳細に含める）
 */
function validateMetaInfoResponse(data: unknown, url: string): void {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;

    // GET_META_INFO構造を確認
    if (obj.GET_META_INFO && typeof obj.GET_META_INFO === "object") {
      const metaInfo = obj.GET_META_INFO as Record<string, unknown>;
      const result = metaInfo.RESULT;

      if (result && typeof result === "object" && result !== null) {
        const resultObj = result as Record<string, unknown>;

        if (typeof resultObj.STATUS === "number") {
          // STATUS=1は警告（データは取得できている）なのでログのみ
          if (resultObj.STATUS === 1) {
            console.warn(
              "e-STAT API warning (STATUS=1):",
              resultObj.ERROR_MSG || "一部にエラーがあります"
            );
          }
          // STATUS>=100は実際のエラー
          else if (resultObj.STATUS >= 100) {
            const errorDetails = {
              STATUS: resultObj.STATUS,
              ERROR_MSG: resultObj.ERROR_MSG,
              URL: url,
              fullResponse: result,
            };
            console.error("e-STAT API error details:", errorDetails);
            throw new Error(
              `e-STAT API error (STATUS=${resultObj.STATUS}): ${
                resultObj.ERROR_MSG || "Unknown error"
              }`
            );
          }
        }
      }
    }
  }
}

/**
 * APIからメタ情報を取得
 *
 * @param statsDataId - 統計表ID
 * @returns メタ情報のAPIレスポンス
 * @throws {Error} API呼び出しが失敗した場合
 */
export async function fetchMetaInfo(
  statsDataId: string
): Promise<EstatMetaInfoResponse> {
  try {
    const params: Omit<GetMetaInfoParams, "appId"> = { statsDataId };
    const requestParams = composeRequestParams(params, ESTAT_APP_ID);
    const url = `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_META_INFO}`;

    const data = await executeHttpRequest<EstatMetaInfoResponse>(
      ESTAT_API.BASE_URL,
      ESTAT_ENDPOINTS.GET_META_INFO,
      requestParams
    );

    validateMetaInfoResponse(data, url);

    return data;
  } catch (error) {
    throw new EstatMetaInfoFetchError(
      `メタ情報の取得に失敗しました: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      statsDataId,
      error
    );
  }
}

/**
 * メタ情報を取得して変換（便利メソッド）
 *
 * @param statsDataId - 統計表ID
 * @returns 変換されたメタデータエントリの配列
 */
export async function fetchAndTransformMetaInfo(
  statsDataId: string
): Promise<TransformedMetadataEntry[]> {
  const response = await fetchMetaInfo(statsDataId);
  return extractCategories(response).map((category) => ({
    stats_data_id: statsDataId,
    stat_name: response.GET_META_INFO.METADATA_INF.TABLE_INF.STAT_NAME?.$ || "",
    title: response.GET_META_INFO.METADATA_INF.TABLE_INF.TITLE?.$ || "",
    cat01: category.id,
    item_name: category.name,
    unit: null,
  }));
}
