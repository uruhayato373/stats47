"use client";

import type { ReactNode } from "react";

import type { AreaType } from "@/features/area";

import { DataUsageCard } from "../DataUsageCard";
import { RankingDefinitionCard } from "../RankingDefinitionCard";


import type { RankingItem } from "@stats47/ranking";

export interface RankingPageSections {
    correlation?: ReactNode;
    rankingPageCards?: ReactNode;
    insights?: ReactNode;
    regionalAnalysis?: ReactNode;
    faq?: ReactNode;
    /** ページ末尾「データ出典」(server で item.json の lineage から解決した DataSourceList) */
    dataSources?: ReactNode;
    /** 統計→公務員AI ファネル CTA — 出典カードの直後・footer 広告の前に表示 */
    funnelCta?: ReactNode;
    /** 解説の後の広告の段 (AdRow。AdSense と PR) */
    adRowMid?: ReactNode;
    /** 出典の後の広告の段 (AdRow。AdSense と PR) */
    adRowFooter?: ReactNode;
    /** ネイティブアフィリエイト枠 (D Phase 2) — AI考察カードの直前に表示 */
    nativeAffiliate?: ReactNode;
    /** 同カテゴリ関連ランキング grid (内部リンク密度↑、GSC indexation 改善) */
    relatedRankings?: ReactNode;
    /** 右サイドバーに表示するコンテンツ（Server Component を注入） */
    sidebar?: ReactNode;
    /** 狭幅では可視化直後に出す関連記事。右レールとはCSSで排他的に表示する。 */
    relatedArticles?: ReactNode;
}

interface RankingPageDisplayInfo {
    title: string;
    subtitle: string;
    demographicAttr: string | null;
    normalizationBasis: string | null;
    description?: string | null;
}

interface RankingPageContentSectionsProps {
    rankingKey: string;
    rankingItem: RankingItem;
    activeRankingItem: RankingItem;
    areaType: AreaType;
    displayInfo: RankingPageDisplayInfo;
    normalizationType?: string;
    dataNote?: string | null;
    sections: RankingPageSections;
}

export function RankingPageContentSections({
    rankingKey,
    rankingItem,
    activeRankingItem,
    areaType,
    displayInfo,
    normalizationType,
    dataNote,
    sections,
}: RankingPageContentSectionsProps) {
    return (
        <>
            {dataNote && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {dataNote}
                </p>
            )}

            <DataUsageCard
                rankingKey={rankingKey}
                areaType={areaType}
                displayInfo={displayInfo}
                yearCount={activeRankingItem.availableYears?.length}
                normalizationType={normalizationType}
                hasAllBases={(rankingItem.calculation?.normalizationOptions?.length ?? 0) > 0}
                categoryKey={rankingItem.categoryKey}
            />

            {sections.insights}

            {sections.adRowMid}

            {sections.faq}
            {sections.regionalAnalysis}
            {sections.correlation}
            {sections.rankingPageCards}

            {displayInfo.description && (
                <RankingDefinitionCard
                    definition={displayInfo.description}
                />
            )}

            {sections.dataSources}

            {sections.funnelCta}

            {sections.adRowFooter}

            {/* 関連ランキングと記事を出典の後の広告の段と PR の列の間に置き、広告の枠を隣り合わせにしない。
                記事は記事カードの格子で、PR の列はページの最後 (テーマのページと同じ。広告の枠の台帳 ads.placements) */}
            {sections.relatedRankings}
            {sections.relatedArticles}
            {sections.nativeAffiliate}
        </>
    );
}
