import useSWR from "swr";

import { FormattedValue } from "@/lib/estat-api";
import { fetcher } from "@/lib/swr/fetcher";

/**
 * 年度一覧を取得するカスタムフック（新API対応）
 * 自動キャッシング、リトライ、エラーハンドリング
 */
export function useRankingYears(rankingKey?: string) {
  const key = rankingKey
    ? `/api/rankings/data/years?rankingKey=${rankingKey}`
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
 * ランキングデータを取得するカスタムフック（新API対応）
 * 自動キャッシング、リトライ、Focus時の再検証
 */
export function useRankingData(rankingKey?: string, timeCode?: string) {
  const key =
    rankingKey && timeCode
      ? `/api/rankings/data?rankingKey=${rankingKey}&timeCode=${timeCode}`
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
