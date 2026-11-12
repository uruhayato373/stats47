import { hrefFor } from "@stats47/data-configs/content/href";
import { resolveRankingItemDataSources } from "@stats47/ranking/survey";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { DataSourceList } from "@/components/molecules/DataSourceList";

import { AdRow, composeAdRows } from "@/features/ads";

import {
  RANKING_INCONTENT_MOBILE,
  RANKING_PAGE_END,
  RANKING_PAGE_FOOTER,
} from "@/lib/google-adsense";

import { shouldShowFunnelCta } from "../../funnel/funnel-cta-config";
import { RankingFunnelCta } from "../../funnel/RankingFunnelCta";
import { computeRankingHeaderStats } from "../../utils/compute-ranking-header-stats";
import { RelatedArticlesCard } from '../RankingSidebar/RelatedArticlesCard';

import { RankingKeyPageClient } from "./RankingKeyPageClient";
import { RankingMakingOfLink } from "./RankingMakingOfLink";
import { RankingPageFaqSection, RankingPageInsightsSection } from "./RankingPageAiSections";
import {
  RankingPageCorrelationSection,
  RankingPageSupplementCardsSection,
} from "./RankingPageAsyncSections";
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
  // 本文の広告の段 (2026-11-03 オーナー決定): 解説の後・出典の後・ページの最後の 3 段。
  // どれも AdSense 1 つを本文の幅いっぱいに出し、PR は出さない (2026-11-12 オーナー決定。300×250 を横に並べると
  // 本文の中で広告が島のように浮いて見えるため。アフィリエイトは戦略を決め直すまで止め、枠は AdSense へ 1 つずつ替える)。
  // AdSense を止めているときは段を出さない
  const [midRow, footerRow, endRow] = composeAdRows(
    [["adsense"], ["adsense"], ["adsense"]],
    [RANKING_INCONTENT_MOBILE, RANKING_PAGE_FOOTER, RANKING_PAGE_END],
    [],
  );
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
            key="sidebar"
            rankingKey={rankingKey}
            areaType={model.areaType}
            rankingItem={model.rankingItem}
            surveys={model.originalSurveys}
            surveyRelatedItems={model.surveyRelatedItems}
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
        adRowMid: midRow.length > 0 ? (
          <AdRow key="ad-row-mid" cells={midRow} position="ranking-row-1" trackingCategory={trackingCategory} wide />
        ) : null,
        adRowFooter: footerRow.length > 0 ? (
          <AdRow key="ad-row-footer" cells={footerRow} position="ranking-row-2" trackingCategory={trackingCategory} wide />
        ) : null,
        adRowEnd: endRow.length > 0 ? (
          <AdRow key="ad-row-end" cells={endRow} position="ranking-row-end" trackingCategory={trackingCategory} wide />
        ) : null,
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
