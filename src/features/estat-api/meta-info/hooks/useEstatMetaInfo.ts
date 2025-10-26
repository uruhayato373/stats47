"use client";

import useSWR from "swr";

import { EstatMetaInfoResponse } from "@/features/estat-api";

/**
 * HTTPリクエストを実行し、レスポンスを処理するfetcher関数
 * useSWRから呼び出され、統一的なエラーハンドリングを提供
 *
 * @param url - リクエスト先のURL
 * @returns Promise<T> - レスポンスデータ
 * @throws Error - HTTPエラーまたはレスポンス解析エラー
 */
async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }

  return response.json();
}

/**
 * APIレスポンスの型定義
 */
interface ApiResponse {
  success: boolean;
  data: EstatMetaInfoResponse;
}

/**
 * useEstatMetaInfoのオプション
 */
export interface UseEstatMetaInfoOptions {
  autoSave?: boolean; // 自動保存を有効にするか
  onSaveSuccess?: (message: string) => void; // 保存成功時のコールバック
  onSaveError?: (error: string) => void; // 保存失敗時のコールバック
}

/**
 * useEstatMetaInfoの戻り値の型定義
 */
export interface UseEstatMetaInfoReturn {
  metaInfo: EstatMetaInfoResponse | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * e-Statメタ情報を取得するカスタムフック（useSWR使用）
 *
 * 機能:
 * - 自動キャッシュ（5分間）
 * - 重複リクエスト排除
 * - エラーリトライ（3回）
 * - ローディング状態管理
 * - 自動R2保存（オプション）
 *
 * @param statsDataId - 統計表ID（nullの場合はリクエストを無効化）
 * @param options - オプション設定
 * @returns メタ情報、エラー、ローディング状態、再取得関数
 */
export function useEstatMetaInfo(
  statsDataId: string | null,
  options?: UseEstatMetaInfoOptions
): UseEstatMetaInfoReturn {
  const { autoSave = false, onSaveSuccess, onSaveError } = options || {};

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    statsDataId ? `/api/estat-api/meta-info/${statsDataId}` : null,
    fetcher,
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
      onSuccess: async (data) => {
        console.log("useEstatMetaInfo - Success:", {
          statsDataId,
          dataKeys: data ? Object.keys(data) : null,
        });

        // 自動保存が有効な場合
        if (autoSave && data?.success && data.data && statsDataId) {
          try {
            const result = await saveMetaInfoToR2(statsDataId, data.data);
            console.log("自動R2保存成功:", result);
            onSaveSuccess?.(result.message || "自動保存が完了しました");
          } catch (error) {
            console.error("自動R2保存エラー:", error);
            onSaveError?.(
              error instanceof Error ? error.message : "自動保存に失敗しました"
            );
          }
        }
      },
      onError: (error) => {
        console.log("useEstatMetaInfo - Error:", {
          statsDataId,
          error: error.message,
        });
      },
    }
  );

  return {
    metaInfo: data?.success ? data.data : null,
    error: error ? "メタ情報の取得に失敗しました" : null,
    isLoading,
    refetch: mutate,
  };
}

/**
 * R2にメタ情報を保存するミューテーション関数
 *
 * @param statsDataId - 統計表ID
 * @param metaInfo - 保存するメタ情報
 * @returns 保存結果
 */
export async function saveMetaInfoToR2(
  statsDataId: string,
  metaInfo: EstatMetaInfoResponse
): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/estat-api/metainfo-cache/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      statsDataId,
      metaInfoResponse: metaInfo,
    }),
  });

  const result = (await response.json()) as {
    success: boolean;
    message: string;
  };

  if (!result.success) {
    throw new Error(result.message || "保存に失敗しました");
  }

  return result;
}
