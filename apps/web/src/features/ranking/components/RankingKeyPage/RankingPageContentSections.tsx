"use client";

import type { ReactNode } from "react";

import type { AreaType } from "@/features/area";
import {
    DataUsageCard,
    RankingDefinitionCard,
    RankingSourceCard,
} from "@/features/ranking";

import {
    ADSENSE_DISPLAY_ENABLED,
    AdSenseAd,
    RANKING_PAGE_FOOTER,
    RANKING_INCONTENT_MOBILE,
} from "@/lib/google-adsense";

import type { RankingItem } from "@stats47/ranking";

export interface RankingPageSections {
    correlation?: ReactNode;
    rankingPageCards?: ReactNode;
    insights?: ReactNode;
    regionalAnalysis?: ReactNode;
    faq?: ReactNode;
    /** 統計→公務員AI ファネル CTA — 出典カードの直後・footer 広告の前に表示 */
    funnelCta?: ReactNode;
    /** AdSense停止中に本文中段へ出す文脈一致バナー（画像のみ） */
    inContentAffiliate?: ReactNode;
    /** ネイティブアフィリエイト枠 (D Phase 2) — AI考察カードの直前に表示 */
    nativeAffiliate?: ReactNode;
    /** 同カテゴリ関連ランキング grid (内部リンク密度↑、GSC indexation 改善) */
    relatedRankings?: ReactNode;
    /** 右サイドバーに表示するコンテンツ（Server Component を注入） */
    sidebar?: ReactNode;
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
            />

            {sections.insights}

            {!ADSENSE_DISPLAY_ENABLED && sections.inContentAffiliate}

            {ADSENSE_DISPLAY_ENABLED && (
                <div className="lg:hidden">
                    <AdSenseAd
                        format={RANKING_INCONTENT_MOBILE.format}
                        slotId={RANKING_INCONTENT_MOBILE.slotId}
                    />
                </div>
            )}

            {sections.faq}
            {sections.regionalAnalysis}
            {sections.correlation}
            {sections.rankingPageCards}

            {displayInfo.description && (
                <RankingDefinitionCard
                    definition={displayInfo.description}
                    itemDetail={rankingItem}
                />
            )}

            {rankingItem?.source && (
                <RankingSourceCard source={rankingItem.source} />
            )}

            {sections.funnelCta}

            {ADSENSE_DISPLAY_ENABLED && (
                <AdSenseAd
                    format={RANKING_PAGE_FOOTER.format}
                    slotId={RANKING_PAGE_FOOTER.slotId}
                />
            )}

            {sections.nativeAffiliate}
            {sections.relatedRankings}
        </>
    );
}
