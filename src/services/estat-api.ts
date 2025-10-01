import {
  EstatMetaInfoResponse,
  EstatStatsDataResponse,
  EstatStatsListResponse,
  GetMetaInfoParams,
  GetStatsDataParams,
  GetStatsListParams,
  EstatAPIError,
  APIResponseError,
} from "@/lib/estat/types";
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
    params: Record<string, unknown>
  ): Promise<T> {
    try {
      const searchParams = new URLSearchParams({
        appId: this.appId,
        lang: ESTAT_API.DEFAULT_LANG,
        dataFormat: ESTAT_API.DATA_FORMAT,
        ...params,
      });

      const url = `${this.baseUrl}${endpoint}?${searchParams.toString()}`;

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

      // e-STAT APIのエラーチェック
      const result = this.extractResult(data);

      if (result && typeof result === "object" && result !== null) {
        const resultObj = result as Record<string, unknown>;
        if (typeof resultObj.STATUS === "number") {
          // STATUS=1は警告（データは取得できている）なのでログのみ
          if (resultObj.STATUS === 1) {
            console.warn('e-STAT API warning (STATUS=1):', resultObj.ERROR_MSG || '一部にエラーがあります');
          }
          // STATUS>=100は実際のエラー
          else if (resultObj.STATUS >= 100) {
            throw EstatAPIError.fromErrorCode(resultObj.STATUS, result);
          }
        }
      }

      return data as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("e-STAT APIへのリクエストがタイムアウトしました");
      }
      throw error;
    }
  }

  /**
   * レスポンスからRESULT情報を抽出
   */
  private extractResult(data: unknown): unknown {
    if (typeof data === "object" && data !== null) {
      const obj = data as Record<string, unknown>;
      if (obj.GET_STATS_DATA && typeof obj.GET_STATS_DATA === "object") {
        const statsData = obj.GET_STATS_DATA as Record<string, unknown>;
        return statsData.RESULT;
      }
      if (obj.GET_META_INFO && typeof obj.GET_META_INFO === "object") {
        const metaInfo = obj.GET_META_INFO as Record<string, unknown>;
        return metaInfo.RESULT;
      }
      if (obj.GET_STATS_LIST && typeof obj.GET_STATS_LIST === "object") {
        const statsList = obj.GET_STATS_LIST as Record<string, unknown>;
        return statsList.RESULT;
      }
      if (obj.GET_DATA_CATALOG && typeof obj.GET_DATA_CATALOG === "object") {
        const dataCatalog = obj.GET_DATA_CATALOG as Record<string, unknown>;
        return dataCatalog.RESULT;
      }
    }
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
