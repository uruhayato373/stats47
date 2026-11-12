"use client";

import { useMemo } from "react";

import {
    type RankingItem,
    type RankingValue,
    buildRankingDisplayInfo,
} from "@stats47/ranking";

import { ArticleShell, PanelGrid } from "@/components/layout";
import { ShareButtons } from "@/components/molecules/ShareButtons";


import { RailAdSlot } from "@/features/ads";
import type { AreaType } from "@/features/area";

import { RANKING_PAGE_TABLE_SIDE } from "@/lib/google-adsense";

import { classifyRankingSubtitle } from "../../utils/classify-subtitle";
import { resolveRankingPresentation } from '../../utils/resolve-ranking-presentation';
import { AreaTypeToggle } from "../AreaTypeToggle";
import {
    RankingHeaderPanel,
    RankingHeaderControls,
    RankingHeaderStats,
} from "../RankingHeader";
import { RankingYearSelector } from "../RankingPageHeader/RankingYearSelector";



import { RankingBasisSwitcher, type RankingBasisMember } from "./RankingBasisSwitcher";
import { RankingPageContentSections, type RankingPageSections } from "./RankingPageContentSections";
import { RankingVisualizationDetails } from "./RankingVisualizationDetails";
import { RankingVisualizationSection } from "./RankingVisualizationSection";
import { useRankingPageState } from "./useRankingPageState";

import type { NationalAveragePoint } from "../../lib/build-national-average-series";

// useBreakpoint removed from layout-gating (replaced with CSS classes for CLS fix)

interface RankingKeyPageClientProps {
    rankingKey: string;
    rankingItem: RankingItem;
    rankingValues: RankingValue[];
    /** サーバーが全年 values から畳んだ総数ベースの全国平均系列 */
    nationalAverageSeries: NationalAveragePoint[];
    areaType?: AreaType;
    selectedYear?: string;
    sections?: RankingPageSections;
    /** 都道府県コード（市区町村ランキング時のフィルタ用） */
    parentAreaCode?: string;
    /** 市区町村ランキング定義（存在する場合にトグルを表示） */
    cityRankingItem?: RankingItem;
    /** グループメンバー（normalization_basis トグル用） */
    groupMembers?: RankingBasisMember[];
    /** ArticleShell の breadcrumb slot に描画するパンくず */
    breadcrumb?: React.ReactNode;
    /** 同じ指標の市区町村ページへのリンク (既存の関連付けからサーバーで解決) */
    municipalityLink?: React.ReactNode;
}

export function RankingKeyPageClient({
    rankingKey,
    rankingItem,
    rankingValues: initialRankingValues,
    nationalAverageSeries: initialNationalAverageSeries,
    areaType = "prefecture",
    selectedYear,
    sections = {},
    parentAreaCode,
    cityRankingItem,
    groupMembers = [],
    breadcrumb,
    municipalityLink,
}: RankingKeyPageClientProps) {
    const {
        activeRankingItem,
        currentAreaType,
        currentYear,
        handleAreaTypeChange,
        handleNormalizationChange,
        handleYearChange,
        isPending,
        nationalAverageSeries,
        normalizationType,
        rankingValues,
    } = useRankingPageState({
        rankingKey,
        rankingItem,
        initialRankingValues,
        initialNationalAverageSeries,
        areaType,
        selectedYear,
        parentAreaCode,
        cityRankingItem,
    });
    // NOTE: useBreakpoint removed for layout-gating usages — replaced with CSS-only
    // responsive classes to eliminate post-hydration CLS (desktop 0.264).
    // The hook file is kept because other non-layout consumers may still use it.

    const presentedItem = useMemo(() => resolveRankingPresentation(activeRankingItem, normalizationType ?? null), [activeRankingItem, normalizationType]);
    const displayInfo = buildRankingDisplayInfo(presentedItem);

    const shareText = useMemo(() => {
        const top = rankingValues.find((v) => v.rank === 1);
        if (!top) return undefined;
        return `${displayInfo.title}、1位は${top.areaName}！ あなたの県は何位？ #stats47`;
    }, [rankingValues, displayInfo.title]);

    // ヒーローカードのメタ操作行: 年度 select + 都道府県/市区町村 seg
    const metaControls = (
        <>
            {activeRankingItem.availableYears && (
                <RankingYearSelector
                    times={activeRankingItem.availableYears}
                    value={currentYear}
                    onChange={handleYearChange}
                />
            )}
            {cityRankingItem && (
                <AreaTypeToggle
                    value={currentAreaType}
                    onChange={handleAreaTypeChange}
                    disabled={isPending}
                />
            )}
        </>
    );

    // 地図・表に関係する操作と地域単位のリンクを見出しのそばに置く。
    const headerActions = (
        <div className="flex flex-col items-end gap-1.5 @sm:flex-row @sm:items-center">
            {metaControls}
            {currentAreaType === "prefecture" && municipalityLink}
        </div>
    );

    const latestYearName =
        rankingItem.availableYears?.find((y) => y.yearCode === currentYear)?.yearName ??
        rankingItem.latestYear?.yearName ??
        null;

    // subtitle を「定義補足」と「データ注釈(※)」に振り分ける。
    // 定義 → 可視化直下 / 注釈 → 本文先頭のキャプション。
    const { subtitle: definitionalSubtitle, note: subtitleNote } =
        classifyRankingSubtitle(displayInfo.subtitle);
    const definitionDetail = [definitionalSubtitle, displayInfo.demographicAttr]
        .filter(Boolean)
        .join("・") || null;
    // データ注釈の正規ソースは config.note → item.annotation (Phase 4 metadata refresh)。
    // annotation があれば優先し、未移行 metric は subtitle ヒューリスティックを fallback。
    const configNote = rankingItem.annotation?.trim()
        ? rankingItem.annotation.trim()
        : null;
    const dataNote = configNote ?? subtitleNote;

    // 右レール: ブログ詳細ページ (/blog/[slug]) と同じ構成に統一。
    // ArticleShell の右レールは shell コンテナ 988px 以上で表示する (本文 656px を保つ境界)。
    // ラッパーもブログと同じ非 sticky の <aside> に揃える。
    // サイド AdSense は右レールが本文の横にあるときだけ出す (RailAdSlot。hidden rail:block)。
    // 最後の 1 枠は 300×600 をヘッダー (56px) の下に追従させる (2026-11-12 オーナー決定。右レールの中身が本文より短く、
    // PC で下が約 840px 空いていた)。右レールは flex の列なので、sticky は右レールの終わり = 本文の終わりで止まり、フッターに重ならない。
    // Google の条件 (幅 300px 以下・縦だけ・同時に見える追従広告は 1 つ・PC だけ) は台帳の adsense-rail-sticky に書いた
    const rail = sections.sidebar ? (
        <>
            {sections.sidebar}
            <RailAdSlot slot={RANKING_PAGE_TABLE_SIDE} sticky />
        </>
    ) : undefined;

    // h1 と操作の行は ArticleShell の header (本文と右レールの列より前の全幅) に置く。
    // 本文に入れると右レールが h1 の横から始まり、右レールの最初のカードが本文の最初のカードより上にずれていた。
    const pageHeader = (
        <div className="mb-4 flex min-w-0 flex-col gap-4">
            <RankingHeaderPanel
                metricTitle={displayInfo.title}
                areaType={currentAreaType}
                updatedAt={activeRankingItem.updatedAt}
            />
            <RankingHeaderControls
                normalizationOptions={rankingItem.calculation?.normalizationOptions}
                normalizationValue={normalizationType ?? "original"}
                onNormalizationChange={handleNormalizationChange}
                normalizationDisabled={isPending}
                shareButton={
                    <ShareButtons title={displayInfo.title} shareText={shareText} variant="menu" />
                }
            />
            <RankingBasisSwitcher rankingKey={rankingKey} members={groupMembers} />
        </div>
    );

    return (
        <ArticleShell rail={rail} breadcrumb={breadcrumb} header={pageHeader}>
            {/*
              並び: (header: h1 → 操作) → スタット → 地図|テーブル → 本文。
              h1 は SEO・a11y の前提なので常に本文より先に置く。
              ページで唯一の <main> はルートレイアウトが持つため、ここは div (main 二重を避ける)。
            */}
            <PanelGrid>
                {/* スタットと地図・表は 1 つの線の格子 (隣り合うパネルが 1px の線を共有する)。
                    ここから下の本文・導線も同じ列の格子のセルとして続く。 */}
                <PanelGrid className="order-3">
                    <RankingHeaderStats
                        metricTitle={displayInfo.title}
                        presentation={presentedItem.visualization}
                        rankingValues={rankingValues}
                        unit={displayInfo.unit}
                        nationalAverageSeries={nationalAverageSeries}
                        areaType={currentAreaType}
                        yearName={latestYearName}
                    />
                    <RankingVisualizationSection
                        rankingItem={presentedItem}
                        activeRankingItem={presentedItem}
                        rankingValues={rankingValues}
                        areaType={currentAreaType}
                        headerActions={headerActions}
                        cardFooter={
                            definitionDetail && <RankingVisualizationDetails description={definitionDetail} />
                        }
                        isPending={isPending}
                    />
                </PanelGrid>

                <PanelGrid className="order-6">
                    <RankingPageContentSections
                        rankingKey={rankingKey}
                        rankingItem={rankingItem}
                        activeRankingItem={activeRankingItem}
                        areaType={currentAreaType}
                        displayInfo={displayInfo}
                        normalizationType={normalizationType}
                        dataNote={dataNote}
                        sections={sections}
                    />
                </PanelGrid>
            </PanelGrid>
        </ArticleShell>
    );
}
