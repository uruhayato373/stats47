import { Suspense } from "react";

import type { AreaType } from "@/features/area";

import { RankingSidebarContainer } from "./RankingSidebarContainer";
import { RankingSidebarSkeleton } from "./RankingSidebarSkeleton";

/**
 * ランキングサイドバーのProps型定義
 */
interface RankingSidebarProps {
  /** ランキングキー（現在表示中） */
  rankingKey: string;
  /** 地域タイプ（都道府県/市区町村） */
  areaType: AreaType;
  /** カテゴリキー（省略時は DB から取得） */
  categoryKey?: string;
}

/**
 * RankingSidebar
 *
 * ランキングサイドバーを表示するコンポーネント
 * SuspenseとRankingSidebarSkeletonを内部で処理し、外部からはシンプルに使用できる
 */
async function RankingSidebar({
  rankingKey,
  areaType,
  categoryKey,
}: RankingSidebarProps) {
  return (
    <Suspense fallback={<RankingSidebarSkeleton />}>
      <RankingSidebarContainer
        rankingKey={rankingKey}
        areaType={areaType}
        categoryKey={categoryKey}
      />
    </Suspense>
  );
}

export { RankingSidebar as RankingItemsSidebar };
