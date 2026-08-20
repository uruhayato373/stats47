"use client";

import { useMemo } from "react";

import Link from "next/link";

import {
    type RankingItem,
    type RankingNationalTrendSnapshot,
    type RankingValue,
    buildRankingDisplayInfo,
} from "@stats47/ranking";

import { ArticleShell } from "@/components/layout";
import { ShareButtons } from "@/components/molecules/ShareButtons";
import { SourceAttribution } from "@/components/molecules/SourceAttribution";


import type { AreaType } from "@/features/area";
import {
    RankingYearSelector,
    AreaTypeToggle,
    RankingHeaderPanel,
    RankingHeaderControls,
    RankingHeaderStats,
    classifyRankingSubtitle,
} from "@/features/ranking";

import {
    ADSENSE_DISPLAY_ENABLED,
    AdSenseAd,
    RANKING_PAGE_TABLE_SIDE,
} from "@/lib/google-adsense";

import { NationalTrendCard } from "../NationalTrendCard/NationalTrendCard";

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
    /** 調査名（surveys テーブルから取得） */
    surveyName?: string;
    /** グループメンバー（normalization_basis トグル用） */
    groupMembers?: RankingBasisMember[];
    /** ArticleShell の breadcrumb slot に描画するパンくず */
    breadcrumb?: React.ReactNode;
    /** 事前生成済み全国時系列 (未生成なら null → カード非表示) */
    nationalTrend?: RankingNationalTrendSnapshot | null;
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
    surveyName,
    groupMembers = [],
    breadcrumb,
    nationalTrend = null,
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

    const displayInfo = useMemo(() => {
        const baseInfo = buildRankingDisplayInfo(rankingItem);

        if (normalizationType) {
            const option = rankingItem.calculation?.normalizationOptions?.find(
                (opt) => opt.type === normalizationType
            );
            if (option) {
                return {
                    ...baseInfo,
                    title: `${baseInfo.title}（${option.label}）`,
                    unit: option.unit,
                    normalizationBasis: option.label,
                };
            }
        }
        return baseInfo;
    }, [rankingItem, normalizationType]);

    const shareText = useMemo(() => {
        const top = rankingValues.find((v) => v.rank === 1);
        if (!top) return undefined;
        return `${displayInfo.title}、1位は${top.areaName}！ あなたの県は何位？ #stats47`;
    }, [rankingValues, displayInfo.title]);

    // カードタイトル・サブタイトル・出典を構築
    // attribution (2 階層: 編成統計 + 原典調査) が焼き込まれていれば統一表示。
    // 未再生成の item.json には無いため、その場合は従来の sourceConfig.source / surveyId 表示にフォールバック。
    const sourceObj = (rankingItem?.sourceConfig as Record<string, unknown>)?.source as { name?: string; url?: string } | undefined;
    const cardFooter = rankingItem?.attribution ? (
        <SourceAttribution attribution={rankingItem.attribution} />
    ) : (sourceObj?.name || surveyName) ? (
        <span>
            {sourceObj?.name && (
                <>出典: {sourceObj.url
                    ? <a href={sourceObj.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">{sourceObj.name}</a>
                    : sourceObj.name
                }</>
            )}
            {sourceObj?.name && surveyName && "　"}
            {surveyName && rankingItem?.surveyId && (
                <>調査: <Link href={`/survey/${rankingItem.surveyId}`} className="hover:text-primary hover:underline">{surveyName}</Link></>
            )}
        </span>
    ) : undefined;

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

    // 地図・テーブルカードヘッダー右側の操作（年度 + エリア切替のみ）
    const headerActions = (
        <div className="flex items-center gap-1.5">
            {metaControls}
        </div>
    );

    // 最終更新日は可視化直下、年度はカードヘッダーと統計サマリに表示する。
    const formattedUpdated = (() => {
        if (!rankingItem.updatedAt) return null;
        try {
            const d = new Date(rankingItem.updatedAt);
            if (Number.isNaN(d.getTime())) return null;
            return d.toISOString().slice(0, 10);
        } catch {
            return null;
        }
    })();
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
    // rightRailBreakpoint="lg" で lg+（1024px）から 360px レールを表示し、
    // ラッパーもブログと同じ非 sticky の <aside className="flex flex-col gap-3"> に揃える。
    // サイド AdSense はレール表示時（lg+）に合わせて hidden lg:block。
    const rail = sections.sidebar ? (
        <>
            {sections.sidebar}
            {ADSENSE_DISPLAY_ENABLED && (
                <div className="hidden lg:block">
                    <AdSenseAd
                        format={RANKING_PAGE_TABLE_SIDE.format}
                        slotId={RANKING_PAGE_TABLE_SIDE.slotId}
                    />
                </div>
            )}
        </>
    ) : undefined;

    return (
        <ArticleShell rail={rail} breadcrumb={breadcrumb}>
            {/*
              モバイルは h1 の直後に地図を出す (旧構成は暗色ヒーロー約470px + タブが
              初期テーブル選択で、地図がヘッダーから約1300px下に埋もれていた)。
              DOM は 1 つのまま order で並べ替える:
                <lg  : h1 → 地図/テーブル → 操作 → スタット → 本文
                lg+ : h1 → 操作 → スタット → 地図|テーブル → 本文
              h1 は SEO・a11y の前提なので常に DOM 先頭に置く。
              ArticleShell が既に <main> を持つため、ここは div (main 二重を避ける)。
            */}
            <div className="flex min-w-0 flex-col gap-4">
                <div className="order-1">
                    <RankingHeaderPanel title={displayInfo.title} />
                </div>

                <div className="order-2 min-w-0 lg:order-4">
                    <RankingVisualizationSection
                        rankingItem={rankingItem}
                        activeRankingItem={activeRankingItem}
                        rankingValues={rankingValues}
                        areaType={currentAreaType}
                        headerActions={headerActions}
                        cardFooter={cardFooter}
                        isPending={isPending}
                    />
                    <RankingVisualizationDetails
                        description={definitionDetail}
                        updatedAt={formattedUpdated}
                    />
                </div>

                <div className="order-3 flex flex-col gap-3 lg:order-2">
                    <RankingHeaderControls
                        normalizationOptions={rankingItem.calculation?.normalizationOptions}
                        normalizationValue={normalizationType ?? "original"}
                        onNormalizationChange={handleNormalizationChange}
                        normalizationDisabled={isPending}
                        shareButton={
                            <ShareButtons title={displayInfo.title} shareText={shareText} />
                        }
                    />
                    <RankingBasisSwitcher rankingKey={rankingKey} members={groupMembers} />
                </div>

                <RankingHeaderStats
                    className="order-4 lg:order-3"
                    rankingValues={rankingValues}
                    unit={displayInfo.unit}
                    nationalAverageSeries={nationalAverageSeries}
                    areaType={currentAreaType}
                    yearName={latestYearName}
                />

                {/*
                  order-5 の枠は残す。この列は order-* でモバイルの並び (地図を先に見せる) を
                  作っているので、order を持たない兄弟を足すと並びが崩れる。
                  全国推移カードは本文コンテンツなので同じ枠の中に入れる。
                */}
                <div className="order-5 flex flex-col gap-4">
                    <NationalTrendCard
                        nationalTrend={nationalTrend}
                        normalizationType={normalizationType}
                        decimalPlaces={displayInfo.decimalPlaces}
                    />

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
                </div>
            </div>
        </ArticleShell>
    );
}
