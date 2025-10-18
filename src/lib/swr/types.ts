/**
 * SWR用の共通型定義
 *
 * このファイルでは、useSWRを使用する際に必要な型定義を提供します。
 * プロジェクト全体で一貫した型安全性を確保するために使用してください。
 */

import { SWRConfiguration, SWRResponse } from "swr";

/**
 * APIレスポンスの基本型
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

/**
 * エラーレスポンスの型
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * 成功レスポンスの型
 */
export interface SuccessResponse<T> extends ApiResponse<T> {
  success: true;
}

/**
 * 統一されたAPIレスポンス型
 */
export type ApiResponseType<T> = SuccessResponse<T> | ErrorResponse;

/**
 * SWR用のエラー型
 */
export interface FetchError extends Error {
  info?: any;
  status?: number;
}

/**
 * SWRフックの戻り値の基本型
 */
export interface UseSWRReturn<T, E = FetchError> {
  data: T | undefined;
  error: E | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (
    data?: T | Promise<T>,
    shouldRevalidate?: boolean
  ) => Promise<T | undefined>;
  mutate: (
    data?: T | Promise<T>,
    shouldRevalidate?: boolean
  ) => Promise<T | undefined>;
}

/**
 * ランキングデータ関連の型
 */
export interface RankingData {
  areaCode: string;
  areaName: string;
  value: number;
  rank: number;
}

export interface RankingDataResponse {
  data: RankingData[];
  years: string[];
  total: number;
}

/**
 * e-Stat統計データ関連の型
 */
export interface EstatStatsData {
  statsDataId: string;
  title: string;
  values: EstatValue[];
}

export interface EstatValue {
  areaCode: string;
  areaName: string;
  value: number;
  unit: string;
  timeCode: string;
}

export interface EstatStatsDataResponse {
  data: EstatStatsData;
  meta: {
    total: number;
    lastUpdated: string;
  };
}

/**
 * メタデータ関連の型
 */
export interface MetaData {
  id: string;
  title: string;
  description?: string;
  category: string;
  subcategory: string;
  statsDataId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetaDataResponse {
  data: MetaData[];
  total: number;
}

/**
 * 年度データ関連の型
 */
export interface YearData {
  year: string;
  label: string;
  isLatest: boolean;
}

export interface YearDataResponse {
  years: YearData[];
}

/**
 * アイテム名関連の型
 */
export interface ItemName {
  id: string;
  name: string;
  description?: string;
  category: string;
}

export interface ItemNameResponse {
  items: ItemName[];
}

/**
 * SWR設定の型
 */
export interface SWRConfig {
  revalidateOnFocus: boolean;
  revalidateOnReconnect: boolean;
  dedupingInterval: number;
  errorRetryCount: number;
  errorRetryInterval: number;
  refreshInterval?: number;
}

/**
 * カスタムSWRフックのオプション型
 */
export interface UseSWROptions extends Partial<SWRConfiguration> {
  fallbackData?: any;
  onSuccess?: (data: any, key: string) => void;
  onError?: (error: FetchError, key: string) => void;
}

/**
 * データフェッチ状態の型
 */
export type DataFetchState<T> = {
  data: T | null;
  error: FetchError | null;
  isLoading: boolean;
  isValidating: boolean;
};

/**
 * ミューテーション結果の型
 */
export interface MutationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 楽観的更新用の型
 */
export interface OptimisticUpdate<T> {
  data: T;
  rollback: () => void;
}

/**
 * キャッシュキーの型
 */
export type CacheKey = string | null | undefined;

/**
 * 条件付きデータ取得用の型
 */
export interface ConditionalDataParams {
  enabled: boolean;
  params: Record<string, any>;
}

/**
 * ページネーション用の型
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 検索・フィルタリング用の型
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
}

/**
 * リアルタイム更新用の型
 */
export interface RealtimeConfig {
  enabled: boolean;
  interval?: number;
  onUpdate?: (data: any) => void;
}

/**
 * エラーハンドリング用の型
 */
export interface ErrorHandler {
  onError: (error: FetchError) => void;
  onRetry: () => void;
  maxRetries?: number;
}

/**
 * ローディング状態の型
 */
export interface LoadingState {
  isLoading: boolean;
  isValidating: boolean;
  isInitialLoading: boolean;
}

/**
 * データ更新用の型
 */
export interface UpdateParams<T> {
  id: string | number;
  data: Partial<T>;
  optimistic?: boolean;
}

/**
 * バッチ操作用の型
 */
export interface BatchOperation<T> {
  operations: Array<{
    type: "create" | "update" | "delete";
    data: T;
  }>;
  onComplete?: (results: MutationResult<T>[]) => void;
}

/**
 * キャッシュ管理用の型
 */
export interface CacheManager {
  get: (key: string) => any;
  set: (key: string, value: any, ttl?: number) => void;
  delete: (key: string) => void;
  clear: () => void;
}

/**
 * デバッグ用の型
 */
export interface DebugInfo {
  key: string;
  data: any;
  error: any;
  isLoading: boolean;
  isValidating: boolean;
  lastUpdated: number;
  cacheSize: number;
}
