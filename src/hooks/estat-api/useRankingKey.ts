import useSWR from "swr";

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
