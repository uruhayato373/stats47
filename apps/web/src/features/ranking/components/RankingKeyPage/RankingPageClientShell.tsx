import { BannerAd, isLandscapeBanner } from "@/features/ads";

import { ADSENSE_DISPLAY_ENABLED } from "@/lib/google-adsense";

import { shouldShowFunnelCta } from "../../funnel/funnel-cta-config";
import { RankingFunnelCta } from "../../funnel/RankingFunnelCta";

import { shouldShowRankingInContentAffiliate } from "./ranking-incontent-affiliate-policy";
import { RankingKeyPageClient } from "./RankingKeyPageClient";
import { RankingPageFaqSection, RankingPageInsightsSection } from "./RankingPageAiSections";
import {
  RankingPageCorrelationSection,
  RankingPageSupplementCardsSection,
} from "./RankingPageAsyncSections";
import { RankingPageBreadcrumbs } from "./RankingPageBreadcrumbs";
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
  const affiliateBanners = model.nativeBanners.filter(isLandscapeBanner);
  const inContentAffiliateBanner = shouldShowRankingInContentAffiliate(rankingKey)
    ? (affiliateBanners[0] ?? null)
    : null;

  return (
    <RankingKeyPageClient
      rankingKey={rankingKey}
      rankingItem={model.rankingItem}
      rankingValues={model.rankingValues}
      nationalAverageSeries={model.nationalAverageSeries}
      areaType={model.areaType}
      selectedYear={model.selectedYear}
      cityRankingItem={model.cityRankingItem?.isActive ? model.cityRankingItem : undefined}
      surveyName={model.surveyName ?? undefined}
      groupMembers={model.groupMembers}
      breadcrumb={
        <RankingPageBreadcrumbs
          key="breadcrumb"
          rankingName={model.rankingName}
          category={model.breadcrumbCategory}
        />
      }
      sections={{
        sidebar: (
          <RankingPageSidebarSection
            affiliateVertical={model.affiliateVertical}
            key="sidebar"
            rankingKey={rankingKey}
            areaType={model.areaType}
            rankingItem={model.rankingItem}
            surveys={model.originalSurveys}
            surveyRelatedItems={model.surveyRelatedItems}
            rankingName={model.rankingName}
          />
        ),
        correlation: (
          <RankingPageCorrelationSection key="correlation" rankingKey={rankingKey} />
        ),
        rankingPageCards: (
          <RankingPageSupplementCardsSection
            key="ranking-page-cards"
            rankingKey={rankingKey}
          />
        ),
        funnelCta: shouldShowFunnelCta(model.rankingItem.categoryKey) ? (
          <RankingFunnelCta key="funnel-cta" rankingKey={rankingKey} />
        ) : null,
        inContentAffiliate: inContentAffiliateBanner ? (
          <div key="in-content-affiliate" className="flex justify-center">
            <BannerAd
              href={inContentAffiliateBanner.href}
              imageUrl={inContentAffiliateBanner.imageUrl}
              trackingPixelUrl={inContentAffiliateBanner.trackingPixelUrl}
              width={inContentAffiliateBanner.width}
              height={inContentAffiliateBanner.height}
              label={inContentAffiliateBanner.title}
              category={inContentAffiliateBanner.vertical ?? "other"}
              position="ranking-incontent"
              adId={inContentAffiliateBanner.id}
              creativeSize={`${inContentAffiliateBanner.width}x${inContentAffiliateBanner.height}`}
            />
          </div>
        ) : null,
        nativeAffiliate: (
          <RankingPageNativeAffiliateSection
            key="native-affiliate"
            banners={
              ADSENSE_DISPLAY_ENABLED
                ? affiliateBanners
                : affiliateBanners.slice(1)
            }
            categoryKey={model.rankingItem.categoryKey}
          />
        ),
        relatedRankings: (
          <RankingPageRelatedRankingsSection
            key="related-rankings"
            rankingKey={rankingKey}
            categoryKey={model.rankingItem.categoryKey}
            areaType={model.areaType}
          />
        ),
        insights: (
          <RankingPageInsightsSection
            key="insights"
            aiContent={model.aiContent}
            rankingName={model.rankingName}
          />
        ),
        regionalAnalysis: null,
        faq: (
          <RankingPageFaqSection
            key="faq"
            aiContent={model.aiContent}
            rankingName={model.rankingName}
          />
        ),
      }}
    />
  );
}
