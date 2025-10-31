/**
 * e-Stat HTTP通信（純粋関数）
 * 責務: HTTP通信、タイムアウト処理、レスポンス取得
 */

import { APIResponseError } from "../types";

/**
 * API URLを構築
 *
 * @param baseUrl - ベースURL
 * @param endpoint - APIエンドポイント
 * @param params - リクエストパラメータ
 * @returns 完全なURL
 */
function composeApiUrl(
  baseUrl: string,
  endpoint: string,
  params: Record<string, unknown>
): string {
  const searchParams = new URLSearchParams();

  // パラメータをURLクエリ文字列に変換
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return `${baseUrl}${endpoint}?${searchParams.toString()}`;
}

/**
 * タイムアウト付きでfetchを実行
 *
 * @param url - リクエストURL
 * @param timeout - タイムアウト時間（ミリ秒）
 * @returns レスポンス
 */
async function executeTimeoutFetch(
  url: string,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

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

    // ネットワークエラーの処理
    if (error instanceof Error) {
      // DNS解決エラー（ENOTFOUND）
      if (
        (error as any).code === "ENOTFOUND" ||
        (error as any).errno === -3008 ||
        error.message.includes("getaddrinfo ENOTFOUND")
      ) {
        throw new Error(
          `ネットワーク接続エラー: ${(error as any).hostname || "api.e-stat.go.jp"} に接続できません。インターネット接続を確認してください。`
        );
      }

      // その他のネットワークエラー
      if (
        (error as any).code === "ECONNREFUSED" ||
        (error as any).code === "ETIMEDOUT" ||
        (error as any).syscall === "getaddrinfo"
      ) {
        throw new Error(
          `ネットワーク接続エラー: e-Stat APIに接続できません。${error.message}`
        );
      }
    }

    throw error;
  }
}

/**
 * レスポンスステータスを検証
 *
 * @param response - HTTPレスポンス
 */
async function validateResponseStatus(response: Response): Promise<void> {
  if (!response.ok) {
    throw new APIResponseError(
      `HTTP error! status: ${response.status}`,
      response.status
    );
  }
}

/**
 * HTTPリクエストを実行
 *
 * @param baseUrl - ベースURL
 * @param endpoint - APIエンドポイント
 * @param params - リクエストパラメータ
 * @param timeout - タイムアウト時間（ミリ秒）
 * @returns レスポンスデータ
 */
export async function executeHttpRequest<T>(
  baseUrl: string,
  endpoint: string,
  params: Record<string, unknown>,
  timeout: number = 25000
): Promise<T> {
  const url = composeApiUrl(baseUrl, endpoint, params);
  console.log("🌐 HTTP Client: リクエストURL:", url);
  const response = await executeTimeoutFetch(url, timeout);
  console.log("🌐 HTTP Client: レスポンスステータス:", response.status);
  await validateResponseStatus(response);
  const data = await response.json();
  console.log("🌐 HTTP Client: レスポンスデータ:", data);
  return data as T;
}
