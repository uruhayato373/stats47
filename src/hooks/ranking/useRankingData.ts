import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { FormattedValue } from "@/lib/estat/types/formatted";

/**
 * 年度一覧を取得するカスタムフック（useSWR使用）
 * 自動キャッシング、リトライ、エラーハンドリング
 */
export function useRankingYears(statsDataId?: string, cdCat01?: string) {
  const key =
    statsDataId && cdCat01
      ? `/api/estat/ranking/years?statsDataId=${statsDataId}&cdCat01=${cdCat01}`
      : null;

  const { data, error, isLoading } = useSWR<{ years: string[] }>(key, fetcher, {
    revalidateOnFocus: false, // 年度はあまり変わらないので再検証しない
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1分間は重複リクエストを排除
  });

  return {
    years: data?.years || [],
    isLoading,
    error,
  };
}

/**
 * ランキングデータを取得するカスタムフック（useSWR使用）
 * 自動キャッシング、リトライ、Focus時の再検証
 */
export function useRankingData(
  statsDataId?: string,
  cdCat01?: string,
  yearCode?: string,
  limit: number = 100000
) {
  const key =
    statsDataId && cdCat01 && yearCode
      ? `/api/estat/ranking/data?statsDataId=${statsDataId}&cdCat01=${cdCat01}&yearCode=${yearCode}&limit=${limit}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<{ data: FormattedValue[] }>(
    key,
    fetcher,
    {
      revalidateOnFocus: true, // タブに戻った時に最新データを取得
      revalidateOnReconnect: true, // ネットワーク再接続時に再取得
      dedupingInterval: 30000, // 30秒間は重複リクエストを排除
      errorRetryCount: 3, // エラー時は3回までリトライ
      errorRetryInterval: 5000, // リトライ間隔は5秒
    }
  );

  return {
    data: data?.data || [],
    isLoading,
    error,
    refetch: mutate, // 手動で再取得する関数
  };
}
