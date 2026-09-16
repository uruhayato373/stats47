import { BannerAd, isLandscapeBanner } from "@/features/ads";
import { detectProductKeyword } from "@/features/ads/constants/product-keywords";

import { ADSENSE_DISPLAY_ENABLED } from "@/lib/google-adsense";

import { shouldShowFunnelCta } from "../../funnel/funnel-cta-config";
import { RankingFunnelCta } from "../../funnel/RankingFunnelCta";
import { computeRankingHeaderStats } from "../../utils/compute-ranking-header-stats";

import { shouldShowRankingInContentAffiliate } from "./ranking-incontent-affiliate-policy";
import { RankingKeyPageClient } from "./RankingKeyPageClient";
import { RankingPageFaqSection, RankingPageInsightsSection } from "./RankingPageAiSections";
import {
  RankingPageCorrelationSection,
  RankingPageSupplementCardsSection,
} from "./RankingPageAsyncSections";
import { RankingPageBreadcrumbs } from "./RankingPageBreadcrumbs";
import { RankingPageNativeAffiliateSection } from "./RankingPageNativeAffiliateSection";
import { RankingPageRakutenNativeSection } from "./RankingPageRakutenNativeSection";
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
  const inContentAffiliateBanner = !ADSENSE_DISPLAY_ENABLED && shouldShowRankingInContentAffiliate(rankingKey)
    ? (affiliateBanners[0] ?? null)
    : null;
  // 中段を抑止したページでは先頭を落とさず、読了枠へ戻す。
  const nativeAffiliateBanners = (inContentAffiliateBanner ? affiliateBanners.slice(1) : affiliateBanners).slice(0, 3);
  const usedAffiliateAds = [inContentAffiliateBanner, ...nativeAffiliateBanners]
    .filter((banner) => banner !== null);

  // 家計調査系 (SURVEY_AFFILIATE_MAP kakei-chousa) は本文の A8 を出さず楽天カードにする
  // (2026-09-16)。中段 native はモバイル=商品軸・デスクトップ=1位県の返礼品、上段 in-content は
  // 描画しない。usedAffiliateAds は据え置き — 出さなかった A8 が右レールへ流れ込まないようにする。
  const isKakeiChousa = (model.originalSurveys ?? []).some((survey) => survey.id === "kakei-chousa");
  const top1Entry = computeRankingHeaderStats(model.rankingValues ?? []).top3[0] ?? null;
  const hasProductKeyword = detectProductKeyword(model.rankingName ?? "") !== null;
  const useRakutenNative = (model.affiliateVertical ?? null) !== null
    && isKakeiChousa
    && (top1Entry !== null || hasProductKeyword);
  const renderedInContentBanner = useRakutenNative ? null : inContentAffiliateBanner;

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
            excludeAffiliateAds={usedAffiliateAds}
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
        inContentAffiliate: renderedInContentBanner ? (
          <div key="in-content-affiliate" className="flex justify-center">
            <BannerAd
              href={renderedInContentBanner.href}
              imageUrl={renderedInContentBanner.imageUrl}
              trackingPixelUrl={renderedInContentBanner.trackingPixelUrl}
              width={renderedInContentBanner.width}
              height={renderedInContentBanner.height}
              label={renderedInContentBanner.title}
              category={renderedInContentBanner.vertical ?? "other"}
              position="ranking-incontent"
              adId={renderedInContentBanner.id}
              creativeSize={`${renderedInContentBanner.width}x${renderedInContentBanner.height}`}
            />
          </div>
        ) : null,
        nativeAffiliate: useRakutenNative ? (
          <RankingPageRakutenNativeSection
            key="native-affiliate"
            rankingName={model.rankingName}
            top1={top1Entry ? { areaCode: top1Entry.areaCode, areaName: top1Entry.areaName } : null}
            hasProductKeyword={hasProductKeyword}
          />
        ) : (
          <RankingPageNativeAffiliateSection
            key="native-affiliate"
            banners={nativeAffiliateBanners}
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
