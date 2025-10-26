/**
 * e-Stat HTTP通信クライアント
 * 責務: HTTP通信のみを担当
 */

import { APIResponseError } from "../types";

/**
 * e-Stat HTTP通信クライアント
 * 責務: HTTP通信、タイムアウト処理、レスポンス取得
 */
export class EstatHTTPClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout: number = 25000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * HTTPリクエストを実行
   *
   * @param endpoint - APIエンドポイント
   * @param params - リクエストパラメータ
   * @returns レスポンスデータ
   */
  async request<T>(
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<T> {
    const url = this.buildURL(endpoint, params);
    console.log("🌐 HTTP Client: リクエストURL:", url);
    const response = await this.fetchWithTimeout(url);
    console.log("🌐 HTTP Client: レスポンスステータス:", response.status);
    await this.checkResponseStatus(response);
    const data = await response.json();
    console.log("🌐 HTTP Client: レスポンスデータ:", data);
    return data;
  }

  /**
   * URLを構築
   *
   * @param endpoint - APIエンドポイント
   * @param params - リクエストパラメータ
   * @returns 完全なURL
   */
  private buildURL(endpoint: string, params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    // パラメータをURLクエリ文字列に変換
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    return `${this.baseUrl}${endpoint}?${searchParams.toString()}`;
  }

  /**
   * タイムアウト付きでfetchを実行
   *
   * @param url - リクエストURL
   * @returns レスポンス
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // タイムアウトエラーの処理
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("e-STAT APIへのリクエストがタイムアウトしました");
      }
      throw error;
    }
  }

  /**
   * レスポンスステータスをチェック
   *
   * @param response - HTTPレスポンス
   */
  private async checkResponseStatus(response: Response): Promise<void> {
    if (!response.ok) {
      throw new APIResponseError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }
  }
}
