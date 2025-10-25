/**
 * SWR用の再利用可能なヘルパーフック
 *
 * このファイルでは、プロジェクト全体で使用できる
 * 共通のSWRフックを提供します。
 */

import useSWR, { SWRConfiguration, mutate } from "swr";

import { fetcher } from "./fetcher";
import {
  ApiResponse,
  FetchError,
  UseSWROptions,
  DataFetchState,
  CacheKey,
  ConditionalDataParams,
  PaginationParams,
  SearchParams,
  RealtimeConfig,
  ErrorHandler,
  LoadingState,
  UpdateParams,
  BatchOperation,
  DebugInfo,
} from "./types";

/**
 * 基本的なAPIデータ取得フック
 *
 * @param url - リクエスト先のURL
 * @param options - SWRオプション
 * @returns SWRレスポンス
 */
export function useApiData<T>(url: CacheKey, options?: UseSWROptions) {
  const config: SWRConfiguration = {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 30000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    ...options,
  };

  return useSWR<T>(url, fetcher, config);
}

/**
 * 条件付きデータ取得フック
 *
 * @param params - 条件付きパラメータ
 * @param options - SWRオプション
 * @returns SWRレスポンス
 */
export function useConditionalData<T>(
  params: ConditionalDataParams,
  options?: UseSWROptions
) {
  const url = params.enabled
    ? `/api/data?${new URLSearchParams(params.params)}`
    : null;

  return useApiData<T>(url, options);
}

/**
 * ページネーション対応データ取得フック
 *
 * @param baseUrl - ベースURL
 * @param pagination - ページネーションパラメータ
 * @param options - SWRオプション
 * @returns SWRレスポンス
 */
export function usePaginatedData<T>(
  baseUrl: string,
  pagination: PaginationParams,
  options?: UseSWROptions
) {
  const url = `${baseUrl}?page=${pagination.page}&limit=${pagination.limit}`;

  return useApiData<T>(url, options);
}

/**
 * 検索・フィルタリング対応データ取得フック
 *
 * @param baseUrl - ベースURL
 * @param search - 検索パラメータ
 * @param options - SWRオプション
 * @returns SWRレスポンス
 */
export function useSearchData<T>(
  baseUrl: string,
  search: SearchParams,
  options?: UseSWROptions
) {
  const params = new URLSearchParams();

  if (search.query) params.append("query", search.query);
  if (search.filters) {
    Object.entries(search.filters).forEach(([key, value]) => {
      params.append(`filter[${key}]`, String(value));
    });
  }
  if (search.sort) {
    params.append("sort", `${search.sort.field}:${search.sort.direction}`);
  }

  const url = `${baseUrl}?${params.toString()}`;

  return useApiData<T>(url, options);
}

/**
 * リアルタイム更新対応データ取得フック
 *
 * @param url - リクエスト先のURL
 * @param config - リアルタイム設定
 * @param options - SWRオプション
 * @returns SWRレスポンス
 */
export function useRealtimeData<T>(
  url: CacheKey,
  config: RealtimeConfig,
  options?: UseSWROptions
) {
  const swrOptions: UseSWROptions = {
    refreshInterval: config.enabled ? config.interval || 30000 : 0,
    onSuccess: (data, key) => {
      if (config.onUpdate) {
        config.onUpdate(data);
      }
      if (options?.onSuccess) {
        options.onSuccess(data, key);
      }
    },
    ...options,
  };

  return useApiData<T>(url, swrOptions);
}

/**
 * エラーハンドリング強化データ取得フック
 *
 * @param url - リクエスト先のURL
 * @param errorHandler - エラーハンドラー
 * @param options - SWRオプション
 * @returns SWRレスポンス
 */
export function useDataWithErrorHandling<T>(
  url: CacheKey,
  errorHandler: ErrorHandler,
  options?: UseSWROptions
) {
  const swrOptions: UseSWROptions = {
    errorRetryCount: errorHandler.maxRetries || 3,
    onError: (error, key) => {
      errorHandler.onError(error);
      if (options?.onError) {
        options.onError(error, key);
      }
    },
    ...options,
  };

  const { data, error, isLoading, isValidating, mutate } = useApiData<T>(
    url,
    swrOptions
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    retry: errorHandler.onRetry,
  };
}

/**
 * 楽観的更新対応データ取得フック
 *
 * @param url - リクエスト先のURL
 * @param options - SWRオプション
 * @returns SWRレスポンスと楽観的更新関数
 */
export function useOptimisticData<T>(url: CacheKey, options?: UseSWROptions) {
  const { data, error, isLoading, isValidating, mutate } = useApiData<T>(
    url,
    options
  );

  const optimisticUpdate = async (
    updateFn: (currentData: T | undefined) => T,
    rollbackFn: () => void
  ) => {
    // 楽観的更新
    const newData = updateFn(data);
    mutate(newData, false);

    try {
      // 実際のAPI呼び出し
      const response = await fetch(url as string, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      // 成功時は再検証
      mutate();
    } catch (error) {
      // 失敗時はロールバック
      rollbackFn();
      throw error;
    }
  };

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    optimisticUpdate,
  };
}

/**
 * バッチ操作用データ取得フック
 *
 * @param url - リクエスト先のURL
 * @param options - SWRオプション
 * @returns SWRレスポンスとバッチ操作関数
 */
export function useBatchData<T>(url: CacheKey, options?: UseSWROptions) {
  const { data, error, isLoading, isValidating, mutate } = useApiData<T>(
    url,
    options
  );

  const batchOperation = async (operation: BatchOperation<T>) => {
    const results = [];

    for (const op of operation.operations) {
      try {
        let response;

        switch (op.type) {
          case "create":
            response = await fetch(url as string, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(op.data),
            });
            break;
          case "update":
            response = await fetch(`${url}/${(op.data as any).id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(op.data),
            });
            break;
          case "delete":
            response = await fetch(`${url}/${(op.data as any).id}`, {
              method: "DELETE",
            });
            break;
        }

        if (response?.ok) {
          results.push({ success: true, data: op.data });
        } else {
          results.push({ success: false, error: "Operation failed" });
        }
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // バッチ操作完了後のコールバック
    if (operation.onComplete) {
      operation.onComplete(results);
    }

    // データを再取得
    mutate();

    return results;
  };

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    batchOperation,
  };
}

/**
 * デバッグ用データ取得フック
 *
 * @param url - リクエスト先のURL
 * @param options - SWRオプション
 * @returns SWRレスポンスとデバッグ情報
 */
export function useDebugData<T>(url: CacheKey, options?: UseSWROptions) {
  const { data, error, isLoading, isValidating, mutate } = useApiData<T>(
    url,
    options
  );

  const debugInfo: DebugInfo = {
    key: url as string,
    data,
    error,
    isLoading,
    isValidating,
    lastUpdated: Date.now(),
    cacheSize: 0, // 実際の実装ではキャッシュサイズを取得
  };

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    debugInfo,
  };
}

/**
 * データフェッチ状態の統合フック
 *
 * @param url - リクエスト先のURL
 * @param options - SWRオプション
 * @returns 統合されたデータフェッチ状態
 */
export function useDataFetchState<T>(
  url: CacheKey,
  options?: UseSWROptions
): DataFetchState<T> {
  const { data, error, isLoading, isValidating } = useApiData<T>(url, options);

  return {
    data: data || null,
    error: error || null,
    isLoading,
    isValidating,
  };
}

/**
 * ローディング状態の統合フック
 *
 * @param url - リクエスト先のURL
 * @param options - SWRオプション
 * @returns 統合されたローディング状態
 */
export function useLoadingState(
  url: CacheKey,
  options?: UseSWROptions
): LoadingState {
  const { isLoading, isValidating } = useApiData(url, options);

  return {
    isLoading,
    isValidating,
    isInitialLoading: isLoading && !isValidating,
  };
}

/**
 * グローバルなデータ再検証フック
 *
 * @returns グローバルなmutate関数
 */
export function useGlobalMutate() {
  const globalMutate = (key?: string) => {
    if (key) {
      return mutate(key);
    } else {
      return mutate();
    }
  };

  return { globalMutate };
}

/**
 * キャッシュ管理フック
 *
 * @returns キャッシュ管理関数
 */
export function useCacheManager() {
  const clearCache = (key?: string) => {
    if (key) {
      return mutate(key, undefined, { revalidate: false });
    } else {
      return mutate();
    }
  };

  const revalidateCache = (key?: string) => {
    if (key) {
      return mutate(key);
    } else {
      return mutate();
    }
  };

  return {
    clearCache,
    revalidateCache,
  };
}
