"use client";

import { useRankingItem } from "@/features/ranking/items/hooks/useRankingItem";
import { RankingMapCard } from "@/features/ranking/shared/components/RankingMapCard";
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

  // ランキングデータは現在取得していないため、空のマップを表示
  // TODO: ランキングデータ（RankingValue[]）を取得して表示する
  return (
    <RankingMapCard
      colorScheme={rankingItem.mapColorScheme}
      divergingMidpoint={rankingItem.mapDivergingMidpoint}
      data={undefined} // ランキングデータは後で実装
    />
  );
}

