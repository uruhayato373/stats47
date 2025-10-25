"use client";

import { use } from "react";

import { RankingItemNotFound } from "@/components/molecules/ranking/RankingItemNotFound";
import { RankingDataCard } from "@/components/organisms/ranking/RankingDataCard";
import { RankingMapCard } from "@/components/organisms/ranking/RankingMapCard";

import { useRankingItem } from "@/hooks/ranking/useRankingItem";

/**
 * ランキング詳細ページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    rankingKey: string;
  }>;
}

/**
 * ランキング詳細ページのメインコンポーネント
 */
export default function RankingKeyPage({ params }: PageProps) {
  const { rankingKey } = use(params);
  const { error } = useRankingItem(rankingKey);

  if (error) {
    return <RankingItemNotFound rankingKey={rankingKey} />;
  }

  return (
    <>
      <RankingMapCard />
      <RankingDataCard rankingKey={rankingKey} />
    </>
  );
}
e;
