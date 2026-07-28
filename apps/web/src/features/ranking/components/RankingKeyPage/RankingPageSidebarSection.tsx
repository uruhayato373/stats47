import { Suspense } from "react";

import { SurfaceCard } from "@/components/surface";

import {
  FurusatoNozeiCard,
  RakutenItemsCard,
  SidebarPromoBanner,
  selectPromoBannerIndexForRanking,
} from "@/features/ads";
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
  /** 1 位県の都道府県コード。楽天ふるさと納税カードの対象 (県を特定できないランキングでは undefined)。 */
  furusatoAreaCode?: string;
  /** ランキング名。楽天商品カードの品目検出に使う。 */
  rankingName: string;
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
  furusatoAreaCode,
  rankingName,
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
      {/* 1 位県の楽天ふるさと納税。furusato 軸は A8 在庫が薄い (banner 2 / text 0) 一方、
          楽天は提携審査が無く API で返礼品を引けるので、需要 (agriculture/administrativefinancial の
          ランキング) に対して唯一供給できる経路になる。県が特定できないランキングでは描画しない。 */}
      {furusatoAreaCode && <FurusatoNozeiCard areaCode={furusatoAreaCode} />}
      {/* ランキング名が品目 (牛肉・うどん等) のとき楽天市場の商品を出す。品目でなければ描画しない。 */}
      <RakutenItemsCard sourceText={rankingName} position="ranking-sidebar" />
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
