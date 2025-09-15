import {
  EstatMetaInfoResponse,
  EstatStatsDataResponse,
  EstatStatsListResponse,
  GetMetaInfoParams,
  GetStatsDataParams,
  GetStatsListParams,
  EstatAPIError,
  APIResponseError,
} from "@/types/estat";
import { ESTAT_API, ESTAT_ENDPOINTS, ESTAT_APP_ID } from "@/lib/constants";

/**
 * e-STAT APIクライアント
 */
export class EstatAPIClient {
  private baseUrl: string;
  private appId: string;

  constructor(appId: string = ESTAT_APP_ID) {
    this.baseUrl = ESTAT_API.BASE_URL;
    this.appId = appId;
  }

  /**
   * APIリクエストの共通処理
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, any>
  ): Promise<T> {
    try {
      const searchParams = new URLSearchParams({
        appId: this.appId,
        lang: ESTAT_API.DEFAULT_LANG,
        dataFormat: ESTAT_API.DATA_FORMAT,
        ...params,
      });

      const url = `${this.baseUrl}${endpoint}?${searchParams.toString()}`;
      console.log("API Request URL:", url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25秒でタイムアウト

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIResponseError(
          `HTTP error! status: ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      console.log("Raw e-Stat API response:", JSON.stringify(data, null, 2));

      // e-STAT APIのエラーチェック
      const result = this.extractResult(data);
      console.log("Extracted result:", result);

      if (result && result.STATUS !== 0) {
        console.error("e-Stat API error status:", result.STATUS, result);
        throw EstatAPIError.fromErrorCode(result.STATUS, result);
      }

      return data;
    } catch (error) {
      console.error("e-STAT API Error:", error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error("e-STAT APIへのリクエストがタイムアウトしました");
      }
      throw error;
    }
  }

  /**
   * レスポンスからRESULT情報を抽出
   */
  private extractResult(data: any): any {
    if (data.GET_STATS_DATA?.RESULT) return data.GET_STATS_DATA.RESULT;
    if (data.GET_META_INFO?.RESULT) return data.GET_META_INFO.RESULT;
    if (data.GET_STATS_LIST?.RESULT) return data.GET_STATS_LIST.RESULT;
    if (data.GET_DATA_CATALOG?.RESULT) return data.GET_DATA_CATALOG.RESULT;
    return null;
  }

  /**
   * メタ情報を取得
   */
  async getMetaInfo(
    params: Omit<GetMetaInfoParams, "appId">
  ): Promise<EstatMetaInfoResponse> {
    return this.request<EstatMetaInfoResponse>(
      ESTAT_ENDPOINTS.GET_META_INFO,
      params
    );
  }

  /**
   * 統計データを取得
   */
  async getStatsData(
    params: Omit<GetStatsDataParams, "appId">
  ): Promise<EstatStatsDataResponse> {
    return this.request<EstatStatsDataResponse>(
      ESTAT_ENDPOINTS.GET_STATS_DATA,
      params
    );
  }

  /**
   * 統計表リストを取得
   */
  async getStatsList(
    params: Omit<GetStatsListParams, "appId">
  ): Promise<EstatStatsListResponse> {
    return this.request<EstatStatsListResponse>(
      ESTAT_ENDPOINTS.GET_STATS_LIST,
      params
    );
  }
}

// デフォルトインスタンス
export const estatAPI = new EstatAPIClient();
