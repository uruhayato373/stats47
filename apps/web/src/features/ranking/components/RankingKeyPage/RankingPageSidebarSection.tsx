import { Suspense } from "react";

import { LayoutGrid } from "lucide-react";


import { RailAdSlot } from "@/features/ads";
import type { AreaType } from "@/features/area";
import { RelatedContentNavigation } from "@/features/content-navigation/RelatedContentNavigation";

import {
  RANKING_RAIL_MIDDLE,
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
  /** この統計の出典調査 (originalSurveys 焼き込み、1-2 件) */
  surveys: { id: string; name: string }[];
  /** 同じ調査の関連ランキング (上位 5 件) */
  surveyRelatedItems?: { rankingKey: string; title: string }[];
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
  surveys,
  surveyRelatedItems,
}: RankingPageSidebarSectionProps) {
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
          title="この指標の地域分析"
          sourceId={`ranking:${rankingKey}`}
          kinds={['geo']}
          limit={1}
          surface="ranking_geo"
        />
      )}
      <RailAdSlot slot={RANKING_SIDEBAR_TOP} />
      {/* 上段と中段の AdSense の間に調査のカードを置き、広告の枠を隣り合わせにしない (広告の枠の台帳 ads.placements) */}
      <SurveyCard
        surveys={surveys.map((survey) => ({ id: survey.id, name: survey.name }))}
        relatedItems={surveyRelatedItems}
      />
      {/* 中段の AdSense (2026-11-12 オーナー決定: アフィリエイトを止め、PR の枠 (労働系の固定のバナーと文脈のバナー) から替えた) */}
      <RailAdSlot slot={RANKING_RAIL_MIDDLE} />
      {/* 分野のランキング一覧を中段と右レールの最後の AdSense の間に置き、広告の枠を隣り合わせにしない
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
