import { executeHttpRequest } from "@/features/estat-api/core/client/http-client";
import {
  ESTAT_API,
  ESTAT_APP_ID,
  ESTAT_ENDPOINTS,
} from "@/features/estat-api/core/constants";

import {
  EstatStatsDataResponse,
  FetchOptions,
  FormattedEstatData,
  GetStatsDataParams,
} from "../types";

import { formatStatsData } from "./formatter";

/**
 * リクエストパラメータを構築
 *
 * @param params - 追加パラメータ
 * @param appId - アプリケーションID
 * @returns 完全なリクエストパラメータ
 */
function buildRequestParams(
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
 * e-Stat APIの統計データレスポンスを検証し、エラーの場合にthrow
 *
 * @param data - e-Stat APIのレスポンスデータ
 * @param url - リクエストURL（エラー詳細に含める）
 */
function validateStatsDataResponse(data: unknown, url: string): void {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;

    // GET_STATS_DATA構造を確認
    if (obj.GET_STATS_DATA && typeof obj.GET_STATS_DATA === "object") {
      const statsData = obj.GET_STATS_DATA as Record<string, unknown>;
      const result = statsData.RESULT;

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
 * 統計データを取得（生データ）
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @returns 統計データのAPIレスポンス
 * @throws {Error} API呼び出しが失敗した場合
 */
export async function fetchStatsData(
  statsDataId: string,
  options: FetchOptions = {}
): Promise<EstatStatsDataResponse> {
  try {
    console.log(`🔵 Fetcher: 統計データ取得開始 - ${statsDataId}`);
    const startTime = Date.now();

    const params: Omit<GetStatsDataParams, "appId"> = {
      statsDataId,
      metaGetFlg: "Y",
      cntGetFlg: "N",
      explanationGetFlg: "N",
      annotationGetFlg: "N",
      replaceSpChars: "0",
      startPosition: 1,
      limit: options.limit || 10000,
      ...(options.categoryFilter && { cdCat01: options.categoryFilter }),
      ...(options.yearFilter && { cdTime: options.yearFilter }),
      ...(options.areaFilter && { cdArea: options.areaFilter }),
    };

    const requestParams = buildRequestParams(params, ESTAT_APP_ID);
    const url = `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_STATS_DATA}`;

    const response = await executeHttpRequest<EstatStatsDataResponse>(
      ESTAT_API.BASE_URL,
      ESTAT_ENDPOINTS.GET_STATS_DATA,
      requestParams
    );

    validateStatsDataResponse(response, url);

    console.log(`✅ Fetcher: 統計データ取得完了 (${Date.now() - startTime}ms)`);
    return response;
  } catch (error) {
    console.error("❌ Fetcher: 統計データ取得失敗:", error);
    console.error("Error details:", {
      statsDataId,
      options,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(
      `統計データの取得に失敗しました: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * 統計データを取得して整形（便利メソッド）
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @returns 整形された統計データ
 */
export async function fetchFormattedStatsData(
  statsDataId: string,
  options: FetchOptions = {}
): Promise<FormattedEstatData> {
  const response = await fetchStatsData(statsDataId, options);
  return formatStatsData(response);
}
