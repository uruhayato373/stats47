import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";

/**
 * ranking_key と ranking_items の設定を取得するカスタムフック
 *
 * @param statsDataId - 統計表ID
 * @param categoryCode - カテゴリコード
 * @returns ranking_key, ranking_item設定, ローディング状態, エラー
 */
export function useRankingKey(statsDataId?: string, categoryCode?: string) {
  const { data, error, isLoading } = useSWR(
    statsDataId && categoryCode
      ? `/api/estat-api/meta-info/ranking-key?statsDataId=${statsDataId}&categoryCode=${categoryCode}`
      : null,
    fetcher
  );

  return {
    // ranking_item が存在する場合は ranking_item.ranking_key を使用
    // 存在しない場合は data.ranking_key を使用
    rankingKey: data?.ranking_item?.ranking_key || data?.ranking_key || null,
    rankingItem: data?.ranking_item || null,
    isLoading,
    error,
  };
}
