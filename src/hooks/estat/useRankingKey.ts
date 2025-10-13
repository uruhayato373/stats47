import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";

/**
 * ranking_key を取得するカスタムフック
 *
 * @param statsDataId - 統計表ID
 * @param categoryCode - カテゴリコード
 * @returns ranking_key, ローディング状態, エラー
 */
export function useRankingKey(statsDataId?: string, categoryCode?: string) {
  const { data, error, isLoading } = useSWR(
    statsDataId && categoryCode
      ? `/api/estat/metainfo/ranking-key?statsDataId=${statsDataId}&categoryCode=${categoryCode}`
      : null,
    fetcher
  );

  return {
    rankingKey: data?.ranking_key || null,
    isLoading,
    error,
  };
}
