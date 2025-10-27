/**
 * e-Stat API クライアント
 * 責務: ビジネスロジック（e-Stat API操作）のみを担当
 */

import { ESTAT_API, ESTAT_APP_ID, ESTAT_ENDPOINTS } from "../constants";
import {
  EstatMetaInfoResponse,
  EstatStatsDataResponse,
  EstatStatsListResponse,
  GetMetaInfoParams,
  GetStatsDataParams,
  GetStatsListParams,
} from "../types";

import { validateEstatResponse } from "./error-handler";
import { executeHttpRequest } from "./http-client";

/**
 * e-Stat API クライアント
 * 責務: e-Stat APIのビジネスロジック（メタ情報取得、統計データ取得、統計表リスト取得）
 */
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
 * メタ情報を取得
 * 統計表の構造や項目情報を取得
 *
 * @param params - メタ情報取得パラメータ
 * @param appId - アプリケーションID
 * @returns メタ情報レスポンス
 */
export async function fetchMetaInfo(
  params: Omit<GetMetaInfoParams, "appId">,
  appId: string = ESTAT_APP_ID
): Promise<EstatMetaInfoResponse> {
  const requestParams = composeRequestParams(params, appId);
  const data = await executeHttpRequest<EstatMetaInfoResponse>(
    ESTAT_API.BASE_URL,
    ESTAT_ENDPOINTS.GET_META_INFO,
    requestParams
  );
  validateEstatResponse(
    data,
    `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_META_INFO}`
  );
  return data;
}

/**
 * 統計データを取得
 * 実際の統計数値を取得（ランキング表示で使用）
 *
 * @param params - 統計データ取得パラメータ
 * @param appId - アプリケーションID
 * @returns 統計データレスポンス
 */
export async function fetchStatsData(
  params: Omit<GetStatsDataParams, "appId">,
  appId: string = ESTAT_APP_ID
): Promise<EstatStatsDataResponse> {
  const requestParams = composeRequestParams(params, appId);
  const data = await executeHttpRequest<EstatStatsDataResponse>(
    ESTAT_API.BASE_URL,
    ESTAT_ENDPOINTS.GET_STATS_DATA,
    requestParams
  );
  validateEstatResponse(
    data,
    `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_STATS_DATA}`
  );
  return data;
}

/**
 * 統計表リストを取得
 * 利用可能な統計表の一覧を取得
 *
 * @param params - 統計表リスト取得パラメータ
 * @param appId - アプリケーションID
 * @returns 統計表リストレスポンス
 */
export async function fetchStatsList(
  params: Omit<GetStatsListParams, "appId">,
  appId: string = ESTAT_APP_ID
): Promise<EstatStatsListResponse> {
  const requestParams = composeRequestParams(params, appId);
  const data = await executeHttpRequest<EstatStatsListResponse>(
    ESTAT_API.BASE_URL,
    ESTAT_ENDPOINTS.GET_STATS_LIST,
    requestParams
  );
  validateEstatResponse(
    data,
    `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_STATS_LIST}`
  );
  return data;
}

// 後方互換性のためにエクスポート（内部実装を関数に変更）
export const estatAPI = {
  fetchMetaInfo: (params: Omit<GetMetaInfoParams, "appId">) =>
    fetchMetaInfo(params),
  fetchStatsData: (params: Omit<GetStatsDataParams, "appId">) =>
    fetchStatsData(params),
  fetchStatsList: (params: Omit<GetStatsListParams, "appId">) =>
    fetchStatsList(params),
};
