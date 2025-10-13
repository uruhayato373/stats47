/**
 * e-Stat API クライアント
 *
 * 政府統計の総合窓口（e-Stat）のAPIとの通信を担当
 *
 * 主要機能:
 * - メタ情報取得（getMetaInfo）
 * - 統計データ取得（getStatsData）
 * - 統計表リスト取得（getStatsList）
 * - タイムアウト処理（25秒）
 * - エラーコードのハンドリング
 *
 * データ取得フロー:
 * パラメータ構築 → HTTPリクエスト → e-Stat API → レスポンス解析 → データ返却
 */

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
 * e-STAT APIクライアントクラス
 *
 * e-Stat APIとの通信を管理し、統一的なエラーハンドリングを提供
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
   *
   * 処理フロー:
   * 1. パラメータをURLクエリ文字列に変換
   * 2. fetch APIでHTTPリクエスト実行（25秒タイムアウト）
   * 3. レスポンスステータスチェック
   * 4. e-Stat APIのエラーコードチェック
   * 5. JSONデータを返却
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<T> {
    try {
      // 1. パラメータをURLクエリ文字列に変換
      const searchParams = new URLSearchParams({
        appId: this.appId, // アプリケーションID
        lang: ESTAT_API.DEFAULT_LANG, // 言語設定（日本語）
        dataFormat: ESTAT_API.DATA_FORMAT, // データ形式（JSON）
        ...params, // 追加パラメータ
      });

      const url = `${this.baseUrl}${endpoint}?${searchParams.toString()}`;

      // 2. fetch APIでHTTPリクエスト実行（25秒タイムアウト）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 3. レスポンスステータスチェック
      if (!response.ok) {
        throw new APIResponseError(
          `HTTP error! status: ${response.status}`,
          response.status
        );
      }

      const data = await response.json();

      // 4. e-Stat APIのエラーコードチェック
      const result = this.extractResult(data);

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
            console.error("Raw resultObj:", resultObj);
            console.error("Raw response data:", data);
            throw EstatAPIError.fromErrorCode(resultObj.STATUS, errorDetails);
          }
        }
      }

      // 5. JSONデータを返却
      return data as T;
    } catch (error) {
      // タイムアウトエラーの処理
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("e-STAT APIへのリクエストがタイムアウトしました");
      }
      throw error;
    }
  }

  /**
   * レスポンスからRESULT情報を抽出
   * e-Stat APIのレスポンス構造から実際のデータ部分を取得
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
   * 統計表の構造や項目情報を取得
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
   * 実際の統計数値を取得（ランキング表示で使用）
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
   * 利用可能な統計表の一覧を取得
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

// デフォルトインスタンス - アプリケーション全体で使用
export const estatAPI = new EstatAPIClient();
