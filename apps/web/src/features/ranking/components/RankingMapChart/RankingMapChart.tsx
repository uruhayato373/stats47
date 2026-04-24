/**
 * RankingMapChart - Server Component
 *
 * ランキングマップチャートコンポーネント
 * SuspenseとRankingMapChartSkeletonを内部で処理し、外部からはシンプルに使用できる
 */

import { Suspense } from "react";

import type { AreaType } from "@/features/area";

import { RankingMapChartContainer } from "./RankingMapChartContainer";
import { RankingMapChartSkeleton } from "./RankingMapChartSkeleton";

import type { RankingItem, RankingValue } from "@stats47/ranking";
import type { StatsSchema } from "@stats47/types";


interface RankingMapChartProps {
  /** ランキング項目情報（色スキーム設定を含む） */
  rankingItem: RankingItem;
  /** ランキングデータ */
  rankingValues: (StatsSchema | RankingValue)[];
  /** 地域タイプ */
  areaType: AreaType;
}

/**
 * RankingMapChart
 *
 * ランキングマップチャートを表示するコンポーネント
 * SuspenseとRankingMapChartSkeletonを内部で処理し、外部からはシンプルに使用できる
 */
export async function RankingMapChart({
  rankingItem,
  rankingValues,
  areaType,
}: RankingMapChartProps) {
  return (
    <Suspense fallback={<RankingMapChartSkeleton />}>
      <RankingMapChartContainer
        rankingItem={rankingItem}
        rankingValues={rankingValues}
        areaType={areaType}
      />
    </Suspense>
  );
}
