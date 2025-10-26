"use client";

import { use } from "react";

import { RankingItemNotFound } from "@/features/ranking/components";
import { RankingMapCard } from "@/features/ranking/components/RankingMapCard";

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

  return <RankingMapCard />;
}
