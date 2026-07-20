import { Suspense } from "react";

import { SurfaceCard } from "@/components/surface";

import { SidebarPromoBanner, selectPromoBannerIndexForRanking } from "@/features/ads";
import { AffiliateAdSlot } from "@/features/ads/server";
import type { AreaType } from "@/features/area";

import { AdSenseAd, RANKING_SIDEBAR_TOP } from "@/lib/google-adsense";

import { RankingItemsSidebar } from "../RankingSidebar";
import { PortStatisticsMapCard } from "../RankingSidebar/PortStatisticsMapCard";
import { RelatedArticlesCard } from "../RankingSidebar/RelatedArticlesCard";
import { SurveyCard } from "../RankingSidebar/SurveyCard";

import type { RankingItem } from "@stats47/ranking";

interface RankingPageSidebarSectionProps {
  rankingKey: string;
  areaType: AreaType;
  rankingItem: Pick<RankingItem, "categoryKey" | "groupKey">;
  /** この統計の出典調査 (originalSurveys 焼き込み、1-2 件) */
  surveys: { id: string; name: string }[];
  /** 同じ調査の関連ランキング (上位 5 件) */
  surveyRelatedItems?: { rankingKey: string; title: string }[];
}

function RankingPageSidebarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-64 rounded-none bg-muted" />
      <div className="h-32 rounded-none bg-muted" />
    </div>
  );
}

export function RankingPageSidebarSection({
  rankingKey,
  areaType,
  rankingItem,
  surveys,
  surveyRelatedItems,
}: RankingPageSidebarSectionProps) {
  return (
    <Suspense fallback={<RankingPageSidebarSkeleton />}>
      {/* P0-2 (2026-07-20): レール先頭は「関連ランキング」(回遊優先)。
          AdSense はスロット2 (依然 above-the-fold) に留め RPM リスクを最小化する。
          full 版 (両広告を最下部) は RPM 実測が無いため不採用。 */}
      <RankingItemsSidebar
        rankingKey={rankingKey}
        areaType={areaType}
        categoryKey={rankingItem.categoryKey}
      />
      <SurfaceCard className="p-3">
        <AdSenseAd
          format={RANKING_SIDEBAR_TOP.format}
          slotId={RANKING_SIDEBAR_TOP.slotId}
        />
      </SurfaceCard>
      <SidebarPromoBanner index={selectPromoBannerIndexForRanking(rankingKey)} />
      <RelatedArticlesCard rankingKey={rankingKey} areaType={areaType} />
      <AffiliateAdSlot
        categoryKey={rankingItem.categoryKey ?? ""}
        position="sidebar"
        rankingKey={rankingKey}
      />
      <SurveyCard
        surveys={surveys.map((survey) => ({ id: survey.id, name: survey.name }))}
        relatedItems={surveyRelatedItems}
      />
      <PortStatisticsMapCard rankingKey={rankingKey} groupKey={rankingItem.groupKey} />
    </Suspense>
  );
}
