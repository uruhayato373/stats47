/**
 * e-Stat HTTP通信（純粋関数）
 * 責務: HTTP通信、タイムアウト処理、レスポンス取得
 */

import { APIResponseError } from "../types";

/**
 * Node.jsのネットワークエラーの型定義
 */
interface NodeJsNetworkError extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
  hostname?: string;
}

/**
 * エラーがNode.jsのネットワークエラーかどうかを判定
 *
 * @param error - 判定対象のエラー
 * @returns Node.jsのネットワークエラーの場合true
 */
function isNodeJsNetworkError(error: unknown): error is NodeJsNetworkError {
  return (
    error instanceof Error &&
    ("code" in error || "errno" in error || "syscall" in error)
  );
}

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
    if (isNodeJsNetworkError(error)) {
      // DNS解決エラー（ENOTFOUND）
      if (
        error.code === "ENOTFOUND" ||
        error.errno === -3008 ||
        error.message.includes("getaddrinfo ENOTFOUND")
      ) {
        throw new Error(
          `ネットワーク接続エラー: ${
            error.hostname || "api.e-stat.go.jp"
          } に接続できません。インターネット接続を確認してください。`
        );
      }

      // その他のネットワークエラー
      if (
        error.code === "ECONNREFUSED" ||
        error.code === "ETIMEDOUT" ||
        error.syscall === "getaddrinfo"
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
  console.log("🌐 HTTP Client: リクエストパラメータ:", params);
  console.log("🌐 HTTP Client: リクエストパラメータ詳細:", {
    hasLimit: "LIMIT" in params || "limit" in params,
    LIMIT: params.LIMIT || params.limit,
    hasStartPosition: "START_POSITION" in params || "startPosition" in params,
    START_POSITION: params.START_POSITION || params.startPosition,
    hasFIELD: "FIELD" in params || "statsField" in params || "field" in params,
    FIELD: params.FIELD || params.statsField || params.field,
    allKeys: Object.keys(params),
  });
  const response = await executeTimeoutFetch(url, timeout);
  console.log("🌐 HTTP Client: レスポンスステータス:", response.status);
  await validateResponseStatus(response);
  const data = await response.json();
  console.log("🌐 HTTP Client: レスポンスデータ:", data);
  console.log("🌐 HTTP Client: レスポンスデータ構造:", {
    keys: data && typeof data === "object" ? Object.keys(data) : [],
    hasGET_STATS_LIST:
      data &&
      typeof data === "object" &&
      "GET_STATS_LIST" in (data as Record<string, unknown>),
  });
  return data as T;
}
