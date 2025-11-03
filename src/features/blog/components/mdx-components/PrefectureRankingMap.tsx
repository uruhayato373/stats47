/**
 * 都道府県ランキングマップコンポーネント（MDX用）
 *
 * MDXコンテンツ内で使用する都道府県ランキングマップ表示コンポーネント
 * クライアントコンポーネントとして実装され、ランタイム時にR2ストレージからデータを取得します。
 */

"use client";

import { useEffect, useState } from "react";

import { getRankingData } from "@/features/ranking/items/actions/getRankingData";
import { RankingMapCard } from "@/features/ranking/shared/components/RankingMapCard";

import type { StatsSchema } from "@/types/stats";

/**
 * PrefectureRankingMapコンポーネントのprops
 */
interface PrefectureRankingMapProps {
  /** ランキングキー */
  rankingKey: string;
  /** 時間（年度など） */
  time: string;
}

/**
 * 都道府県ランキングマップコンポーネント
 *
 * MDXコンテンツ内で使用する都道府県別ランキングマップを表示します。
 * クライアントコンポーネントとして実装され、ランタイム時にデータを取得します。
 */
export function PrefectureRankingMap({
  rankingKey,
  time,
}: PrefectureRankingMapProps) {
  const [rankingData, setRankingData] = useState<StatsSchema[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!rankingKey) {
        setError("rankingKeyが指定されていません");
        setIsLoading(false);
        return;
      }

      if (!time) {
        setError("timeが指定されていません");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 都道府県データを取得（areaType: "prefecture"）
        const data = await getRankingData("prefecture", rankingKey, time);

        if (!data || data.length === 0) {
          setError("ランキングデータが見つかりませんでした");
          setRankingData(null);
        } else {
          setRankingData(data);
        }
      } catch (err) {
        console.error("Failed to fetch ranking data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "ランキングデータの取得に失敗しました"
        );
        setRankingData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [rankingKey, time]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">ランキングデータを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!rankingData || rankingData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        データがありません
      </div>
    );
  }

  return (
    <RankingMapCard
      data={rankingData}
      colorScheme="interpolateBlues"
      height={600}
    />
  );
}
