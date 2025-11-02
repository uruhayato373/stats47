"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useRankingItem } from "@/features/ranking/items/hooks/useRankingItem";
import { getRankingData } from "@/features/ranking/items/actions/getRankingData";
import { RankingMapCard } from "@/features/ranking/shared/components/RankingMapCard";
import { RankingItemNotFound } from "./RankingItemNotFound";

import type { RankingValue } from "../types";

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
  const [rankingData, setRankingData] = useState<RankingValue[] | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // クエリパラメータから年度を取得
  const year = searchParams.get("year");

  // ランキングデータを取得
  useEffect(() => {
    async function fetchData() {
      if (!rankingItem || !year) {
        setRankingData(null);
        return;
      }

      setIsLoadingData(true);
      try {
        const data = await getRankingData(
          rankingItem.areaType,
          rankingKey,
          year
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
  if (isLoadingData && year) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">ランキングデータを読み込み中...</p>
      </div>
    );
  }

  return (
    <RankingMapCard
      colorScheme={rankingItem.mapColorScheme}
      divergingMidpoint={rankingItem.mapDivergingMidpoint}
      data={rankingData || undefined}
    />
  );
}

