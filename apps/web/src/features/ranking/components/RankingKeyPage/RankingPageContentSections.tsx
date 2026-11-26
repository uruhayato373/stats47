"use client";

import type { ReactNode } from "react";

import { normalizeUnitsInText } from "@stats47/data-configs/unit";

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
    /** 解説の後の広告の段 (AdRow。幅いっぱいの AdSense 1 つ) */
    adRowMid?: ReactNode;
    /** 出典の後の広告の段 (AdRow。幅いっぱいの AdSense 1 つ) */
    adRowFooter?: ReactNode;
    /** ページの最後の広告の段 (AdRow。幅いっぱいの AdSense 1 つ。2026-11-12 に PR の列から替えた) */
    adRowEnd?: ReactNode;
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
    /** 集計条件 (指標の補足・属性。「2025年・全目的・一般客」など) */
    definitionDetail?: string | null;
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
    definitionDetail,
    sections,
}: RankingPageContentSectionsProps) {
    return (
        <>
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

            {(displayInfo.description || dataNote || definitionDetail) && (
                <RankingDefinitionCard
                    condition={definitionDetail}
                    definition={displayInfo.description}
                    note={dataNote ? normalizeUnitsInText(dataNote) : null}
                />
            )}

            {sections.dataSources}

            {sections.adRowFooter}

            {/* 関連ランキングを出典の後の広告の段とページの最後の広告の段の間に置き、広告の枠を隣り合わせにしない
                (広告の枠の台帳 ads.placements) */}
            {sections.relatedRankings}
            {sections.adRowEnd}
        </>
    );
}
