/**
 * e-Stat統計データ取得カスタムフック（useSWR最適化版）
 * 責務: 統計データ取得の状態管理とビジネスロジック
 */

"use client";

import { useMemo } from "react";

import useSWR from "swr";

import {
  EstatStatsDataResponse,
  GetStatsDataParams,
} from "@/features/estat-api/core/types";
import { generateStatsDataCacheKey } from "@/features/estat-api/stats-data/services/cache-key";

/**
 * APIレスポンスの型定義
 */
interface ApiResponse {
  success: boolean;
  data: EstatStatsDataResponse;
}

/**
 * useEstatStatsDataの戻り値の型定義
 */
interface UseEstatStatsDataReturn {
  data: EstatStatsDataResponse | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * 統計データ取得用のfetcher関数
 *
 * @param cacheKey - キャッシュキー（URL形式）
 * @returns 統計データレスポンス
 */
async function statsDataFetcher(
  cacheKey: string
): Promise<EstatStatsDataResponse> {
  console.log("🔵 Stats Data Fetcher: 開始", cacheKey);

  try {
    const response = await fetch(cacheKey, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = (await response.json()) as { error?: string };
        errorMessage = errorData.error || errorMessage;
      } catch {
        const textResponse = await response.text();
        errorMessage = `HTTP ${response.status}: ${textResponse.substring(
          0,
          100
        )}`;
      }
      throw new Error(errorMessage);
    }

    let data: EstatStatsDataResponse;
    try {
      const responseText = await response.text();
      data = JSON.parse(responseText) as EstatStatsDataResponse;
    } catch (jsonError) {
      throw new Error(
        `Invalid JSON response: ${
          jsonError instanceof Error ? jsonError.message : "Unknown error"
        }`
      );
    }

    console.log("✅ Stats Data Fetcher: 完了", {
      dataKeys: data ? Object.keys(data) : null,
    });

    return data;
  } catch (error) {
    console.error("❌ Stats Data Fetcher: エラー", error);
    throw error;
  }
}

/**
 * e-Stat統計データを取得するカスタムフック（useSWR使用）
 *
 * 機能:
 * - 自動キャッシュ（5分間）
 * - 重複リクエスト排除
 * - エラーリトライ（3回）
 * - ローディング状態管理
 * - パラメータ変更時の自動再取得
 *
 * @param params - 統計データ取得パラメータ（nullの場合はリクエストを無効化）
 * @returns 統計データ、エラー、ローディング状態、再取得関数
 */
export function useEstatStatsData(
  params: GetStatsDataParams | null
): UseEstatStatsDataReturn {
  // キャッシュキー生成
  const cacheKey = useMemo(() => {
    return params ? generateStatsDataCacheKey(params) : null;
  }, [params]);

  // useSWRでデータ取得
  const { data, error, isLoading, mutate } = useSWR<EstatStatsDataResponse>(
    cacheKey,
    statsDataFetcher,
    {
      revalidateOnFocus: false, // フォーカス時の再検証は無効（データが頻繁に変わらないため）
      revalidateOnReconnect: true, // ネットワーク再接続時は再取得
      dedupingInterval: 300000, // 5分間は同じリクエストを共有（重複排除）
      errorRetryCount: 3, // エラー時は3回までリトライ
      errorRetryInterval: 5000, // リトライ間隔は5秒
      shouldRetryOnError: (error) => {
        // タイムアウトエラーの場合はリトライしない
        if (error?.message?.includes("timeout")) {
          return false;
        }
        return true;
      },
      onSuccess: (data) => {
        console.log("✅ useEstatStatsData - Success:", {
          params,
          dataKeys: data ? Object.keys(data) : null,
        });
      },
      onError: (error) => {
        console.log("❌ useEstatStatsData - Error:", {
          params,
          error: error.message,
        });
      },
    }
  );

  return {
    data: data || null,
    error: error ? "統計データの取得に失敗しました" : null,
    isLoading,
    refetch: mutate,
  };
}
