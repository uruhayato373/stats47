import { Suspense } from "react";

import { RelatedRankingsGrid } from "../RelatedRankingsGrid/RelatedRankingsGrid";

import type { AreaType } from "@stats47/types";

interface RankingPageRelatedRankingsSectionProps {
  rankingKey: string;
  categoryKey?: string | null;
  areaType: AreaType;
}

export function RankingPageRelatedRankingsSection({
  rankingKey,
  categoryKey,
  areaType,
}: RankingPageRelatedRankingsSectionProps) {
  if (!categoryKey) return null;

  return (
    <Suspense fallback={null}>
      <RelatedRankingsGrid
        rankingKey={rankingKey}
        categoryKey={categoryKey}
        areaType={areaType}
        limit={9}
      />
    </Suspense>
  );
}
