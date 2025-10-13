import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { EstatStatsDataResponse } from "@/lib/estat/types";
import { PrefectureRankingParams } from "@/types/models";

/**
 * クエリパラメータを構築するヘルパー関数
 */
function buildQueryString(params: PrefectureRankingParams): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  return queryParams.toString();
}

/**
 * e-Stat APIからデータを取得するカスタムフック（useSWR使用）
 *
 * @param params - e-Stat APIリクエストパラメータ
 * @returns データ、エラー、ローディング状態、再取得関数
 */
export function useEstatData(params: PrefectureRankingParams | null) {
  const key = params ? `/api/estat/data?${buildQueryString(params)}` : null;

  const { data, error, isLoading, mutate } = useSWR<EstatStatsDataResponse>(
    key,
    fetcher,
    {
      revalidateOnFocus: false, // フォーカス時の再検証は無効
      revalidateOnReconnect: true, // ネットワーク再接続時は再取得
      dedupingInterval: 60000, // 1分間は同じリクエストを共有
      errorRetryCount: 3, // エラー時は3回までリトライ
      errorRetryInterval: 5000, // リトライ間隔は5秒
      shouldRetryOnError: (error) => {
        // タイムアウトエラーの場合はリトライしない
        if (error?.message?.includes("timeout")) {
          return false;
        }
        return true;
      },
    }
  );

  return {
    data: data || null,
    error: error ? error.message || "データ取得に失敗しました" : null,
    isLoading,
    refetch: mutate,
  };
}
