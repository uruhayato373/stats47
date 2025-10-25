/**
 * SWR用のユーティリティ関数
 *
 * このファイルでは、SWRを使用する際に便利な
 * ユーティリティ関数を提供します。
 */

import { mutate } from "swr";

import { CacheKey, FetchError, ApiResponse, ErrorResponse } from "./types";

/**
 * キャッシュキーを生成する
 *
 * @param baseUrl - ベースURL
 * @param params - パラメータ
 * @returns キャッシュキー
 */
export function generateCacheKey(
  baseUrl: string,
  params?: Record<string, any>
): string {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * 条件付きキャッシュキーを生成する
 *
 * @param baseUrl - ベースURL
 * @param condition - 条件
 * @param params - パラメータ
 * @returns キャッシュキー（条件がfalseの場合はnull）
 */
export function generateConditionalCacheKey(
  baseUrl: string,
  condition: boolean,
  params?: Record<string, any>
): CacheKey {
  return condition ? generateCacheKey(baseUrl, params) : null;
}

/**
 * エラーをチェックして適切な型に変換する
 *
 * @param error - エラーオブジェクト
 * @returns FetchError
 */
export function normalizeError(error: any): FetchError {
  if (error instanceof Error) {
    return error as FetchError;
  }

  const fetchError: FetchError = new Error(
    error?.message || "An unknown error occurred"
  );

  if (error?.info) {
    fetchError.info = error.info;
  }

  if (error?.status) {
    fetchError.status = error.status;
  }

  return fetchError;
}

/**
 * APIレスポンスをチェックしてエラーハンドリングする
 *
 * @param response - APIレスポンス
 * @returns 成功時はデータ、失敗時はエラーをthrow
 */
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    const errorResponse = response as ErrorResponse;
    const error: FetchError = new Error(errorResponse.error.message);
    error.info = errorResponse.error;
    throw error;
  }

  return response.data;
}

/**
 * リトライ機能付きのfetch関数
 *
 * @param url - リクエスト先のURL
 * @param options - fetchオプション
 * @param maxRetries - 最大リトライ回数
 * @param retryDelay - リトライ間隔（ミリ秒）
 * @returns Promise<T>
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError!;
}

/**
 * デバウンス機能付きのキャッシュキー生成
 *
 * @param baseUrl - ベースURL
 * @param params - パラメータ
 * @param delay - デバウンス遅延（ミリ秒）
 * @returns デバウンスされたキャッシュキー
 */
export function createDebouncedCacheKey(
  baseUrl: string,
  params: Record<string, any>,
  delay: number = 300
): () => Promise<string> {
  let timeoutId: NodeJS.Timeout;

  return new Promise((resolve) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      resolve(generateCacheKey(baseUrl, params));
    }, delay);
  });
}

/**
 * キャッシュの有効性をチェックする
 *
 * @param key - キャッシュキー
 * @param maxAge - 最大有効期間（ミリ秒）
 * @returns キャッシュが有効かどうか
 */
export function isCacheValid(key: string, maxAge: number = 300000): boolean {
  // 実際の実装では、キャッシュのタイムスタンプを確認
  // ここでは簡易的な実装
  return true;
}

/**
 * キャッシュをクリアする
 *
 * @param pattern - クリアするキャッシュのパターン（正規表現）
 */
export function clearCacheByPattern(pattern: RegExp): void {
  // 実際の実装では、SWRのキャッシュからパターンに一致するキーを削除
  // ここでは簡易的な実装
  mutate((key) => pattern.test(key), undefined, { revalidate: false });
}

/**
 * データの差分をチェックする
 *
 * @param oldData - 古いデータ
 * @param newData - 新しいデータ
 * @returns 差分があるかどうか
 */
export function hasDataChanged<T>(
  oldData: T | undefined,
  newData: T | undefined
): boolean {
  if (oldData === undefined && newData === undefined) return false;
  if (oldData === undefined || newData === undefined) return true;

  return JSON.stringify(oldData) !== JSON.stringify(newData);
}

/**
 * データを正規化する
 *
 * @param data - 正規化するデータ
 * @param normalizer - 正規化関数
 * @returns 正規化されたデータ
 */
export function normalizeData<T, R>(
  data: T | undefined,
  normalizer: (data: T) => R
): R | undefined {
  return data ? normalizer(data) : undefined;
}

/**
 * エラーメッセージをユーザーフレンドリーに変換する
 *
 * @param error - エラーオブジェクト
 * @returns ユーザーフレンドリーなエラーメッセージ
 */
export function getUserFriendlyErrorMessage(error: FetchError): string {
  if (error.status) {
    switch (error.status) {
      case 400:
        return "リクエストが正しくありません。入力内容を確認してください。";
      case 401:
        return "認証が必要です。ログインしてください。";
      case 403:
        return "この操作を実行する権限がありません。";
      case 404:
        return "データが見つかりませんでした。";
      case 429:
        return "リクエストが多すぎます。しばらく待ってから再試行してください。";
      case 500:
        return "サーバーエラーが発生しました。しばらく待ってから再試行してください。";
      default:
        return `エラーが発生しました（${error.status}）。`;
    }
  }

  if (error.info?.message) {
    return error.info.message;
  }

  return error.message || "不明なエラーが発生しました。";
}

/**
 * ローディング状態を判定する
 *
 * @param isLoading - ローディング中かどうか
 * @param isValidating - 検証中かどうか
 * @returns ローディング状態の詳細
 */
export function getLoadingState(isLoading: boolean, isValidating: boolean) {
  return {
    isInitialLoading: isLoading && !isValidating,
    isRefreshing: !isLoading && isValidating,
    isAnyLoading: isLoading || isValidating,
  };
}

/**
 * データの存在をチェックする
 *
 * @param data - チェックするデータ
 * @returns データが存在するかどうか
 */
export function hasData<T>(data: T | undefined | null): data is T {
  return data !== undefined && data !== null;
}

/**
 * 空のデータをチェックする
 *
 * @param data - チェックするデータ
 * @returns データが空かどうか
 */
export function isEmptyData<T>(data: T | undefined | null): boolean {
  if (!hasData(data)) return true;

  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object") return Object.keys(data).length === 0;
  if (typeof data === "string") return data.trim() === "";

  return false;
}

/**
 * データの型をチェックする
 *
 * @param data - チェックするデータ
 * @param type - 期待する型
 * @returns データが期待する型かどうか
 */
export function isDataOfType<T>(data: any, type: string): data is T {
  return typeof data === type;
}

/**
 * データを安全にアクセスする
 *
 * @param data - アクセスするデータ
 * @param path - アクセスパス
 * @param defaultValue - デフォルト値
 * @returns 安全にアクセスされた値
 */
export function safeGet<T>(data: any, path: string, defaultValue: T): T {
  try {
    const keys = path.split(".");
    let result = data;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }

    return result !== undefined ? result : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * データを安全に設定する
 *
 * @param data - 設定するデータ
 * @param path - 設定パス
 * @param value - 設定値
 * @returns 設定されたデータ
 */
export function safeSet<T>(data: any, path: string, value: T): any {
  try {
    const keys = path.split(".");
    const result = { ...data };
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === null || current[key] === undefined) {
        current[key] = {};
      } else {
        current[key] = { ...current[key] };
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return result;
  } catch {
    return data;
  }
}

/**
 * データをフィルタリングする
 *
 * @param data - フィルタリングするデータ
 * @param filterFn - フィルタ関数
 * @returns フィルタリングされたデータ
 */
export function filterData<T>(
  data: T[] | undefined,
  filterFn: (item: T) => boolean
): T[] {
  if (!Array.isArray(data)) return [];
  return data.filter(filterFn);
}

/**
 * データをソートする
 *
 * @param data - ソートするデータ
 * @param key - ソートキー
 * @param direction - ソート方向
 * @returns ソートされたデータ
 */
export function sortData<T>(
  data: T[] | undefined,
  key: keyof T,
  direction: "asc" | "desc" = "asc"
): T[] {
  if (!Array.isArray(data)) return [];

  return [...data].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

/**
 * データをページネーションする
 *
 * @param data - ページネーションするデータ
 * @param page - ページ番号
 * @param limit - 1ページあたりの件数
 * @returns ページネーションされたデータ
 */
export function paginateData<T>(
  data: T[] | undefined,
  page: number,
  limit: number
): { data: T[]; total: number; totalPages: number } {
  if (!Array.isArray(data)) {
    return { data: [], total: 0, totalPages: 0 };
  }

  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    data: data.slice(startIndex, endIndex),
    total,
    totalPages,
  };
}
