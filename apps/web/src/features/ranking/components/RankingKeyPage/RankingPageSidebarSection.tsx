import { Suspense } from "react";

import { LayoutGrid, MapPin } from "lucide-react";


import {
  RailAdSlot,
  SidebarPromoBanner,
  selectPromoBannerIndexForRanking,
} from "@/features/ads";
import type { AffiliateVertical } from "@/features/ads/constants/affiliate-category";
import type { AffiliateDestination } from "@/features/ads/constants/affiliate-delivery-policy";
import { SIDEBAR_PROMO_BANNERS } from "@/features/ads/constants/sidebar-banners";
import { AffiliateAdSlot, RakutenItemsCard } from "@/features/ads/server";
import type { AreaType } from "@/features/area";
import { RelatedContentNavigation } from "@/features/content-navigation/RelatedContentNavigation";

import {
  ADSENSE_DISPLAY_ENABLED,
  RANKING_SIDEBAR_TOP,
} from "@/lib/google-adsense";

import { RankingItemsSidebar } from "../RankingSidebar";
import { PortStatisticsMapCard } from "../RankingSidebar/PortStatisticsMapCard";
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
  /** 本文で既に使うリンクを除外し、レールで同じ案件を繰り返さない。 */
  excludeAffiliateAds?: readonly AffiliateDestination[];
}

function RankingPageSidebarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-64 rounded-card bg-muted" />
      <div className="h-32 rounded-card bg-muted" />
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
  excludeAffiliateAds = [],
}: RankingPageSidebarSectionProps) {
  // 品目が一致する家計調査だけを優先する。null（広告なし）の解決結果は覆さない。
  // 品目・R2在庫がない場合、カード自身が何も描画しない。
  const prioritizeRakutenItems = affiliateVertical !== null
    && surveys.some((survey) => survey.id === "kakei-chousa");
  const rakutenItems = (
    <RakutenItemsCard
      sourceText={rankingName}
      position={prioritizeRakutenItems ? "rakuten-sidebar" : "ranking-sidebar"}
    />
  );
  const promoBannerIndex = selectPromoBannerIndexForRanking(rankingKey);
  const reservedPromo = affiliateVertical === "labor" ? SIDEBAR_PROMO_BANNERS[promoBannerIndex] : undefined;
  const contextualAffiliateBanners = (
    <AffiliateAdSlot
      categoryKey={rankingItem.categoryKey ?? ""}
      vertical={affiliateVertical}
      position="sidebar"
      rankingKey={rankingKey}
      bannerOnly
      // 右レールの PR は固定のバナーと合わせて 2 枚まで (2026-10-29。広告の枠の台帳の「PR のバナー」1 枠にまとめた)
      bannerLimit={reservedPromo ? 1 : 2}
      excludeAds={reservedPromo ? [...excludeAffiliateAds, reservedPromo] : excludeAffiliateAds}
    />
  );

  return (
    <Suspense fallback={<RankingPageSidebarSkeleton />}>
      {areaType === "prefecture" && (
        <RelatedContentNavigation
          title="この指標を使うテーマ"
          icon={<LayoutGrid />}
          sourceId={`ranking:${rankingKey}`}
          kinds={['theme']}
          limit={3}
          surface="ranking_theme"
        />
      )}
      {areaType === "prefecture" && (
        <RelatedContentNavigation
          title="この指標を市区町村で見る"
          icon={<MapPin />}
          sourceId={`ranking:${rankingKey}`}
          kinds={['municipality-ranking']}
          limit={1}
          surface="ranking_municipality"
        />
      )}
      {areaType === "prefecture" && (
        <RelatedContentNavigation
          title="この指標の地域分析"
          sourceId={`ranking:${rankingKey}`}
          kinds={['geo']}
          limit={1}
          surface="ranking_geo"
        />
      )}
      {/* AdSense停止中は、空いた上段へ既存の文脈一致バナーを移す。
          枠数は最大2のまま、表示位置だけを上げてviewable impressionを増やす。 */}
      {!ADSENSE_DISPLAY_ENABLED && contextualAffiliateBanners}
      <RailAdSlot slot={RANKING_SIDEBAR_TOP} />
      {/* AdSense と PR の間に調査のカードを置き、広告の枠を隣り合わせにしない (広告の枠の台帳 config/ads/placements.json) */}
      <SurveyCard
        surveys={surveys.map((survey) => ({ id: survey.id, name: survey.name }))}
        relatedItems={surveyRelatedItems}
      />
      {/* PR の枠: 固定のバナー (労働系だけ) と文脈のバナーを合わせて 2 枚まで、続けて 1 か所に置く。
          ランキング名が品目 (牛肉・うどん等) のときは楽天市場の商品カードも同じ枠に入る (品目でなければ描画しない)。
          AdSense 再開時は従来の上段から戻し、同一バナーを二重描画しない。 */}
      <SidebarPromoBanner
        index={promoBannerIndex}
        rankingKey={rankingKey}
        vertical={affiliateVertical}
        excludeAds={excludeAffiliateAds}
      />
      {/* 家計調査の品目 (優先表示) の商品カードは、本文中段 (RankingPageRakutenNativeSection) のモバイル版と重複させないため
          デスクトップ限定 (2026-09-16)。2026-10-29 に AdSense 上段の前から PR の枠の中へ移した */}
      {prioritizeRakutenItems ? <div className="hidden lg:block">{rakutenItems}</div> : rakutenItems}
      {ADSENSE_DISPLAY_ENABLED && contextualAffiliateBanners}
      {/* 分野のランキング一覧を PR の枠と右レールの最後の AdSense の間に置き、広告の枠を隣り合わせにしない
          (2026-10-29 オーナー判断。AdSense 上段が上に上がり、デスクトップでは最初の画面に入ることがある) */}
      <RankingItemsSidebar
        rankingKey={rankingKey}
        areaType={areaType}
        categoryKey={rankingItem.categoryKey}
      />
      <PortStatisticsMapCard rankingKey={rankingKey} groupKey={rankingItem.groupKey} />
    </Suspense>
  );
}
