import { RankingKeyPageClient } from "./RankingKeyPageClient";
import { RankingPageFaqSection, RankingPageInsightsSection } from "./RankingPageAiSections";
import {
  RankingPageCorrelationSection,
  RankingPageSupplementCardsSection,
} from "./RankingPageAsyncSections";
import { RankingPageNativeAffiliateSection } from "./RankingPageNativeAffiliateSection";
import { RankingPageRelatedRankingsSection } from "./RankingPageRelatedRankingsSection";
import { RankingPageSidebarSection } from "./RankingPageSidebarSection";

import type { RankingPageModel } from "../../services/load-ranking-page-model";

interface RankingPageClientShellProps {
  rankingKey: string;
  model: RankingPageModel;
}

export function RankingPageClientShell({
  rankingKey,
  model,
}: RankingPageClientShellProps) {
  return (
    <RankingKeyPageClient
      rankingKey={rankingKey}
      rankingItem={model.rankingItem}
      rankingValues={model.rankingValues}
      areaType={model.areaType}
      selectedYear={model.selectedYear}
      topology={model.topology}
      cityRankingItem={model.cityRankingItem?.isActive ? model.cityRankingItem : undefined}
      surveyName={model.surveyName ?? undefined}
      categoryName={model.breadcrumbCategory?.name}
      groupMembers={model.groupMembers}
      sections={{
        sidebar: (
          <RankingPageSidebarSection
            rankingKey={rankingKey}
            areaType={model.areaType}
            rankingItem={model.rankingItem}
            surveys={model.allSurveys}
          />
        ),
        correlation: <RankingPageCorrelationSection rankingKey={rankingKey} />,
        rankingPageCards: <RankingPageSupplementCardsSection rankingKey={rankingKey} />,
        nativeAffiliate: (
          <RankingPageNativeAffiliateSection
            banners={model.nativeBanners}
            categoryName={model.category?.categoryName}
            categoryKey={model.rankingItem.categoryKey}
          />
        ),
        relatedRankings: (
          <RankingPageRelatedRankingsSection
            rankingKey={rankingKey}
            categoryKey={model.rankingItem.categoryKey}
            areaType={model.areaType}
          />
        ),
        insights: (
          <RankingPageInsightsSection
            aiContent={model.aiContent}
            rankingName={model.rankingName}
          />
        ),
        regionalAnalysis: null,
        faq: (
          <RankingPageFaqSection
            aiContent={model.aiContent}
            rankingName={model.rankingName}
          />
        ),
      }}
    />
  );
}
