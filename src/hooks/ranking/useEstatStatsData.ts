/**
 * e-Stat統計データ取得カスタムフック
 *
 * useSWRを使用した自動データ取得:
 * - 自動キャッシング（1分間）
 * - エラー時の自動リトライ（最大3回）
 * - 重複リクエストの排除
 * - ネットワーク再接続時の再取得
 *
 * データ取得フロー:
 * パラメータ変更 → SWRキー生成 → /api/estat-api/stats-data呼び出し → e-Stat API → データ返却
 */

import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { EstatStatsDataResponse } from "@/lib/estat-api";
import { PrefectureRankingParams } from "@/types/models";

/**
 * クエリパラメータを構築するヘルパー関数
 * PrefectureRankingParamsオブジェクトをURLクエリ文字列に変換
 * 例: {statsDataId: "0000010101", categoryCode: "A1101"}
 *     → "statsDataId=0000010101&categoryCode=A1101"
 */
function buildQueryString(params: PrefectureRankingParams): string {
  const queryParams = new URLSearchParams();

  // オブジェクトの各プロパティをクエリパラメータに追加
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  return queryParams.toString();
}

/**
 * e-Stat APIから統計データを取得するカスタムフック（useSWR使用）
 *
 * パラメータが変更されると自動的にAPI呼び出しを実行
 * キャッシング、リトライ、エラーハンドリングを自動化
 *
 * @param params - e-Stat APIリクエストパラメータ
 * @returns データ、エラー、ローディング状態、再取得関数
 */
export function useEstatStatsData(params: PrefectureRankingParams | null) {
  // SWRキー生成 - パラメータがnullの場合はデータ取得を無効化
  const key = params
    ? `/api/estat-api/stats-data?${buildQueryString(params)}`
    : null;

  // デバッグ情報を追加
  console.log("useEstatStatsData - Debug Info:", {
    params,
    key,
    queryString: params ? buildQueryString(params) : null,
  });

  const { data, error, isLoading, mutate } = useSWR<EstatStatsDataResponse>(
    key,
    fetcher,
    {
      revalidateOnFocus: false, // フォーカス時の再検証は無効（データが頻繁に変わらないため）
      revalidateOnReconnect: true, // ネットワーク再接続時は再取得
      dedupingInterval: 60000, // 1分間は同じリクエストを共有（重複排除）
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
        console.log("useEstatStatsData - Success:", {
          dataKeys: data ? Object.keys(data) : null,
        });
      },
      onError: (error) => {
        console.log("useEstatStatsData - Error:", error);
      },
    }
  );

  return {
    data: data || null,
    error: error ? error.message || "データ取得に失敗しました" : null,
    isLoading,
    refetch: mutate, // 手動で再取得する関数
  };
}
