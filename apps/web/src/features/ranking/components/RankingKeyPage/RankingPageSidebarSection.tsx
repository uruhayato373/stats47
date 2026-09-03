import { Suspense } from "react";

import { SurfaceCard } from "@/components/surface";

import {
  SidebarPromoBanner,
  selectPromoBannerIndexForRanking,
} from "@/features/ads";
import type { AffiliateVertical } from "@/features/ads/constants/affiliate-category";
import { AffiliateAdSlot, RakutenItemsCard } from "@/features/ads/server";
import type { AreaType } from "@/features/area";

import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  RANKING_SIDEBAR_TOP,
} from "@/lib/google-adsense";

import { RankingItemsSidebar } from "../RankingSidebar";
import { PortStatisticsMapCard } from "../RankingSidebar/PortStatisticsMapCard";
import { RelatedArticlesCard } from "../RankingSidebar/RelatedArticlesCard";
import { SurveyCard } from "../RankingSidebar/SurveyCard";

import type { RankingItem } from "@stats47/ranking";


interface RankingPageSidebarSectionProps {
  rankingKey: string;
  areaType: AreaType;
  rankingItem: Pick<RankingItem, "categoryKey" | "groupKey">;
  /** ページ内容 (出典調査 → タグ → カテゴリ) から解決した意図軸。null = 意図軸の広告を出さない */
  affiliateVertical?: AffiliateVertical | null;
  /** この統計の出典調査 (originalSurveys 焼き込み、1-2 件) */
  surveys: { id: string; name: string }[];
  /** 同じ調査の関連ランキング (上位 5 件) */
  surveyRelatedItems?: { rankingKey: string; title: string }[];
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
  affiliateVertical,
  surveys,
  surveyRelatedItems,
  rankingName,
}: RankingPageSidebarSectionProps) {
  const contextualAffiliateBanners = (
    <AffiliateAdSlot
      categoryKey={rankingItem.categoryKey ?? ""}
      vertical={affiliateVertical}
      position="sidebar"
      rankingKey={rankingKey}
      bannerOnly
      bannerLimit={2}
    />
  );

  return (
    <Suspense fallback={<RankingPageSidebarSkeleton />}>
      {/* レール先頭は「関連ランキング」(回遊優先)。広告はその直後に置く。 */}
      <RankingItemsSidebar
        rankingKey={rankingKey}
        areaType={areaType}
        categoryKey={rankingItem.categoryKey}
      />
      {/* AdSense停止中は、空いた上段へ既存の文脈一致バナーを移す。
          枠数は最大2のまま、表示位置だけを上げてviewable impressionを増やす。 */}
      {!ADSENSE_DISPLAY_ENABLED && contextualAffiliateBanners}
      {ADSENSE_DISPLAY_ENABLED && (
        <SurfaceCard className="p-3">
          <AdSenseAd
            format={RANKING_SIDEBAR_TOP.format}
            slotId={RANKING_SIDEBAR_TOP.slotId}
          />
        </SurfaceCard>
      )}
      <SidebarPromoBanner index={selectPromoBannerIndexForRanking(rankingKey)} />
      {/* ランキング名が品目 (牛肉・うどん等) のとき楽天市場の商品を出す。品目でなければ描画しない。 */}
      <RakutenItemsCard sourceText={rankingName} position="ranking-sidebar" />
      <RelatedArticlesCard rankingKey={rankingKey} areaType={areaType} />
      {/* AdSense再開時は従来位置へ戻し、同一バナーを二重描画しない。 */}
      {ADSENSE_DISPLAY_ENABLED && contextualAffiliateBanners}
      <SurveyCard
        surveys={surveys.map((survey) => ({ id: survey.id, name: survey.name }))}
        relatedItems={surveyRelatedItems}
      />
      <PortStatisticsMapCard rankingKey={rankingKey} groupKey={rankingItem.groupKey} />
    </Suspense>
  );
}
