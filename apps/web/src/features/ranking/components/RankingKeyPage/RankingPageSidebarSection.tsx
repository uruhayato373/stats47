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
  rankingItem: Pick<RankingItem, "categoryKey" | "groupKey" | "surveyId">;
  surveys: { id: string; name: string }[];
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
}: RankingPageSidebarSectionProps) {
  return (
    <Suspense fallback={<RankingPageSidebarSkeleton />}>
      <SurfaceCard className="p-3">
        <AdSenseAd
          format={RANKING_SIDEBAR_TOP.format}
          slotId={RANKING_SIDEBAR_TOP.slotId}
        />
      </SurfaceCard>
      <RankingItemsSidebar
        rankingKey={rankingKey}
        areaType={areaType}
        categoryKey={rankingItem.categoryKey}
      />
      <SidebarPromoBanner index={selectPromoBannerIndexForRanking(rankingKey)} />
      <RelatedArticlesCard rankingKey={rankingKey} areaType={areaType} />
      <AffiliateAdSlot
        categoryKey={rankingItem.categoryKey ?? ""}
        position="sidebar"
        rankingKey={rankingKey}
      />
      <SurveyCard
        surveys={surveys.map((survey) => ({ id: survey.id, name: survey.name }))}
        currentSurveyId={rankingItem.surveyId ?? undefined}
      />
      <PortStatisticsMapCard rankingKey={rankingKey} groupKey={rankingItem.groupKey} />
    </Suspense>
  );
}
