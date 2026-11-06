import { hrefFor } from "@stats47/data-configs/content/href";
import { resolveRankingItemDataSources } from "@stats47/ranking/survey";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { DataSourceList } from "@/components/molecules/DataSourceList";

import { AdRow, composeAdRows, isLandscapeBanner } from "@/features/ads";

import {
  HUB_INCONTENT,
  RANKING_INCONTENT_MOBILE,
  RANKING_PAGE_FOOTER,
} from "@/lib/google-adsense";

import { shouldShowFunnelCta } from "../../funnel/funnel-cta-config";
import { RankingFunnelCta } from "../../funnel/RankingFunnelCta";
import { computeRankingHeaderStats } from "../../utils/compute-ranking-header-stats";
import { RelatedArticlesCard } from '../RankingSidebar/RelatedArticlesCard';

import { shouldShowRankingInContentAffiliate } from "./ranking-incontent-affiliate-policy";
import { RankingKeyPageClient } from "./RankingKeyPageClient";
import { RankingMakingOfLink } from "./RankingMakingOfLink";
import { RankingPageFaqSection, RankingPageInsightsSection } from "./RankingPageAiSections";
import {
  RankingPageCorrelationSection,
  RankingPageSupplementCardsSection,
} from "./RankingPageAsyncSections";
import { RankingPageNativeAffiliateSection } from "./RankingPageNativeAffiliateSection";
import { RankingPageRelatedRankingsSection } from "./RankingPageRelatedRankingsSection";
import { RankingPageSidebarSection } from "./RankingPageSidebarSection";

import type { RankingPageModel } from "../../services/load-ranking-page-model";

/** 地図の行政区域データ。値の出典ではないので note で区別して同じ「データ出典」に並べる */
const MAP_DATA_SOURCE = {
  label: "『歴史的行政区域データセットβ版』（CODH作成）",
  url: "https://geoshape.ex.nii.ac.jp/city/",
  tables: [],
  note: "地図データ",
};

interface RankingPageClientShellProps {
  rankingKey: string;
  model: RankingPageModel;
}

export function RankingPageClientShell({
  rankingKey,
  model,
}: RankingPageClientShellProps) {
  const affiliateBanners = model.nativeBanners.filter(isLandscapeBanner);
  // 広告の段 (2026-11-03 オーナー決定): 解説の後と出典の後の 2 段。本文の幅に入る数だけ左から出す
  // (右レールのある本文 810px では 2 枠、モバイルは先頭の 1 枠 = 上から AdSense → PR)。
  // 解説の後に PR を出さない指標 (ranking-incontent-affiliate-policy) は、その段を AdSense だけにする。
  // AdSense を止めているときは AdSense の枠が落ち、PR だけの段になる
  const [midRow, footerRow] = composeAdRows(
    [
      shouldShowRankingInContentAffiliate(rankingKey)
        ? ["adsense", "affiliate", "adsense"]
        : ["adsense", "adsense"],
      ["affiliate", "adsense", "affiliate"],
    ],
    [RANKING_INCONTENT_MOBILE, HUB_INCONTENT, RANKING_PAGE_FOOTER],
    affiliateBanners,
  );
  const rowBanners = [...midRow, ...footerRow].flatMap((cell) => (cell.kind === "affiliate" ? [cell.banner] : []));
  // 段で使ったバナーは読了位置の PR の列と右レールに出さない (同じ案件を 1 ページで重ねない)
  const nativeAffiliateBanners = affiliateBanners
    .filter((banner) => !rowBanners.includes(banner))
    .slice(0, 3);
  const usedAffiliateAds = [...rowBanners, ...nativeAffiliateBanners];

  // 家計調査系 (SURVEY_AFFILIATE_MAP kakei-chousa) は本文の A8 を出さず楽天カードにする
  // (2026-09-16)。中段 native はモバイル=商品軸・デスクトップ=1位県の返礼品、上段 in-content は
  // 描画しない。usedAffiliateAds は据え置き — 出さなかった A8 が右レールへ流れ込まないようにする。
  const isKakeiChousa = (model.originalSurveys ?? []).some((survey) => survey.id === "kakei-chousa");
  const hideAffiliateOnKakei = (model.affiliateVertical ?? null) !== null && isKakeiChousa;
  // 家計調査の品目は段の A8 も出さず AdSense の枠だけにする (読了位置と同じ判断)
  const bodyCells = (cells: typeof midRow) =>
    hideAffiliateOnKakei ? cells.filter((cell) => cell.kind === "adsense") : cells;
  const trackingCategory = `ranking-${model.rankingItem.categoryKey ?? "general"}`;

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
        // 共通の Breadcrumbs が見た目と BreadcrumbList JSON-LD を一体で出す (JSON-LD はここだけ)。
        // 階層は旧 JSON-LD と同じ ホーム > ランキング > {カテゴリ} > {ランキング名}。
        <Breadcrumbs
          key="breadcrumb"
          items={[
            { label: "ホーム", href: "/" },
            { label: "ランキング", href: "/ranking" },
            ...(model.breadcrumbCategory
              ? [{
                  label: model.breadcrumbCategory.name,
                  href: hrefFor("category", { categoryKey: model.breadcrumbCategory.key }),
                }]
              : []),
            { label: model.rankingName },
          ]}
        />
      }
      sections={{
        relatedArticles: <RelatedArticlesCard rankingKey={rankingKey} areaType={model.areaType} />,
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
        dataSources: (
          <div key="data-sources" className="space-y-3">
            <DataSourceList
              sources={[...resolveRankingItemDataSources(model.rankingItem), MAP_DATA_SOURCE]}
              surface="ranking_source"
            />
            <RankingMakingOfLink rankingKey={rankingKey} />
          </div>
        ),
        funnelCta: shouldShowFunnelCta(model.rankingItem.categoryKey) ? (
          <RankingFunnelCta key="funnel-cta" rankingKey={rankingKey} />
        ) : null,
        adRowMid: bodyCells(midRow).length > 0 ? (
          <AdRow key="ad-row-mid" cells={bodyCells(midRow)} position="ranking-row-1" trackingCategory={trackingCategory} />
        ) : null,
        adRowFooter: bodyCells(footerRow).length > 0 ? (
          <AdRow key="ad-row-footer" cells={bodyCells(footerRow)} position="ranking-row-2" trackingCategory={trackingCategory} />
        ) : null,
        nativeAffiliate: hideAffiliateOnKakei ? null : (
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
