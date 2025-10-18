import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { EstatMetaInfoResponse } from "@/lib/estat-api";

/**
 * useEstatMetaInfoの戻り値の型定義
 */
interface UseEstatMetaInfoReturn {
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
 *
 * @param statsDataId - 統計表ID（nullの場合はリクエストを無効化）
 * @returns メタ情報、エラー、ローディング状態、再取得関数
 */
export function useEstatMetaInfo(
  statsDataId: string | null
): UseEstatMetaInfoReturn {
  const { data, error, isLoading, mutate } = useSWR(
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
      onSuccess: (data) => {
        console.log("useEstatMetaInfo - Success:", {
          statsDataId,
          dataKeys: data ? Object.keys(data) : null,
        });
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
    metaInfo: data?.data || null,
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

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "保存に失敗しました");
  }

  return result;
}
