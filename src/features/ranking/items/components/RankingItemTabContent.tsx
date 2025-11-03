"use client";

import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { getRankingData } from "@/features/ranking/items/actions/getRankingData";
import { getRankingMetadata } from "@/features/ranking/items/actions/getRankingMetadata";
import { useRankingItem } from "@/features/ranking/items/hooks/useRankingItem";
import {
  RankingDataTable,
  RankingMapCard,
} from "@/features/ranking/shared/components";

import type { StatsSchema } from "@/types/stats";

import { RankingItemNotFound } from "./RankingItemNotFound";

interface RankingItemTabContentProps {
  rankingKey: string;
}

/**
 * ランキングアイテムのタブコンテンツコンポーネント
 *
 * ランキングアイテムの情報を取得し、ランキングマップを表示します。
 */
export function RankingItemTabContent({
  rankingKey,
}: RankingItemTabContentProps) {
  const { rankingItem, isLoading, error } = useRankingItem(rankingKey);
  const searchParams = useSearchParams();
  const [rankingData, setRankingData] = useState<StatsSchema[] | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // クエリパラメータから年度を取得
  const year = searchParams.get("year");

  // ランキングデータを取得
  useEffect(() => {
    async function fetchData() {
      if (!rankingItem) {
        setRankingData(null);
        return;
      }

      // クエリパラメータがない場合は最新年度を取得
      let targetYear = year;
      if (!targetYear) {
        try {
          const metadata = await getRankingMetadata(
            rankingItem.areaType,
            rankingKey
          );
          if (metadata?.times && metadata.times.length > 0) {
            // 年度情報を降順ソートして最新年度を取得（4桁形式）
            const sortedTimes = [...metadata.times].sort((a, b) => {
              const timeCodeA = parseInt(a.timeCode, 10);
              const timeCodeB = parseInt(b.timeCode, 10);
              return timeCodeB - timeCodeA;
            });
            targetYear = sortedTimes[0]?.timeCode;
          }
        } catch (err) {
          console.error("Failed to fetch metadata:", err);
          setRankingData(null);
          return;
        }
      }

      // 年度が取得できた場合のみデータを取得
      if (!targetYear) {
        setRankingData(null);
        return;
      }

      setIsLoadingData(true);
      try {
        const data = await getRankingData(
          rankingItem.areaType,
          rankingKey,
          targetYear
        );
        setRankingData(data);
      } catch (err) {
        console.error("Failed to fetch ranking data:", err);
        setRankingData(null);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [rankingItem, rankingKey, year]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (error || !rankingItem) {
    return <RankingItemNotFound rankingKey={rankingKey} />;
  }

  // データ読み込み中
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">ランキングデータを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RankingMapCard
        colorScheme={rankingItem.mapColorScheme}
        divergingMidpoint={rankingItem.mapDivergingMidpoint}
        data={rankingData || undefined}
      />
      {rankingData && rankingData.length > 0 && (
        <RankingDataTable data={rankingData} rankingItem={rankingItem} />
      )}
    </div>
  );
}
