/**
 * e-Stat API クライアント
 * 責務: ビジネスロジック（e-Stat API操作）のみを担当
 */

import { ESTAT_API, ESTAT_ENDPOINTS, ESTAT_APP_ID } from "../constants";
import {
  EstatMetaInfoResponse,
  EstatStatsDataResponse,
  EstatStatsListResponse,
  GetMetaInfoParams,
  GetStatsDataParams,
  GetStatsListParams,
} from "../types";

import { EstatErrorHandler } from "./error-handler";
import { EstatHTTPClient } from "./http-client";

/**
 * e-Stat API クライアント
 * 責務: e-Stat APIのビジネスロジック（メタ情報取得、統計データ取得、統計表リスト取得）
 */
export class EstatAPIClient {
  private httpClient: EstatHTTPClient;
  private appId: string;

  constructor(appId: string = ESTAT_APP_ID) {
    this.httpClient = new EstatHTTPClient(ESTAT_API.BASE_URL);
    this.appId = appId;
  }

  /**
   * メタ情報を取得
   * 統計表の構造や項目情報を取得
   *
   * @param params - メタ情報取得パラメータ
   * @returns メタ情報レスポンス
   */
  async getMetaInfo(
    params: Omit<GetMetaInfoParams, "appId">
  ): Promise<EstatMetaInfoResponse> {
    const requestParams = this.buildParams(params);
    const data = await this.httpClient.request<EstatMetaInfoResponse>(
      ESTAT_ENDPOINTS.GET_META_INFO,
      requestParams
    );
    EstatErrorHandler.checkEstatError(
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
   * @returns 統計データレスポンス
   */
  async getStatsData(
    params: Omit<GetStatsDataParams, "appId">
  ): Promise<EstatStatsDataResponse> {
    const requestParams = this.buildParams(params);
    const data = await this.httpClient.request<EstatStatsDataResponse>(
      ESTAT_ENDPOINTS.GET_STATS_DATA,
      requestParams
    );
    EstatErrorHandler.checkEstatError(
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
   * @returns 統計表リストレスポンス
   */
  async getStatsList(
    params: Omit<GetStatsListParams, "appId">
  ): Promise<EstatStatsListResponse> {
    const requestParams = this.buildParams(params);
    const data = await this.httpClient.request<EstatStatsListResponse>(
      ESTAT_ENDPOINTS.GET_STATS_LIST,
      requestParams
    );
    EstatErrorHandler.checkEstatError(
      data,
      `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_STATS_LIST}`
    );
    return data;
  }

  /**
   * リクエストパラメータを構築
   *
   * @param params - 追加パラメータ
   * @returns 完全なリクエストパラメータ
   */
  private buildParams(
    params: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      appId: this.appId,
      lang: ESTAT_API.DEFAULT_LANG,
      dataFormat: ESTAT_API.DATA_FORMAT,
      ...params,
    };
  }
}

// デフォルトインスタンス - アプリケーション全体で使用
export const estatAPI = new EstatAPIClient();
