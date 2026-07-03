"use client";

import { useMemo } from "react";

import Link from "next/link";

import {
    type RankingItem,
    type RankingValue,
    buildRankingDisplayInfo,
} from "@stats47/ranking";

import { PageShell } from "@/components/layout";
import { ShareButtons } from "@/components/molecules/ShareButtons";
import { SourceAttribution } from "@/components/molecules/SourceAttribution";


import type { AreaType } from "@/features/area";
import {
    RankingYearSelector,
    AreaTypeToggle,
    RankingHeroCard,
    classifyRankingSubtitle,
} from "@/features/ranking";

import { AdSenseAd, RANKING_PAGE_TABLE_SIDE } from "@/lib/google-adsense";

import { RankingBasisSwitcher, type RankingBasisMember } from "./RankingBasisSwitcher";
import { RankingPageContentSections, type RankingPageSections } from "./RankingPageContentSections";
import { RankingVisualizationSection } from "./RankingVisualizationSection";
import { useRankingPageState } from "./useRankingPageState";

import type { TopoJSONTopology } from "@stats47/types";

// useBreakpoint removed from layout-gating (replaced with CSS classes for CLS fix)

interface RankingKeyPageClientProps {
    rankingKey: string;
    rankingItem: RankingItem;
    rankingValues: RankingValue[];
    areaType?: AreaType;
    selectedYear?: string;
    topology?: TopoJSONTopology | null;
    sections?: RankingPageSections;
    /** 都道府県コード（市区町村ランキング時のフィルタ用） */
    parentAreaCode?: string;
    /** 市区町村ランキング定義（存在する場合にトグルを表示） */
    cityRankingItem?: RankingItem;
    /** 調査名（surveys テーブルから取得） */
    surveyName?: string;
    /** カテゴリ名（ヒーローカードの eyebrow 表示用） */
    categoryName?: string;
    /** グループメンバー（normalization_basis トグル用） */
    groupMembers?: RankingBasisMember[];
}

export function RankingKeyPageClient({
    rankingKey,
    rankingItem,
    rankingValues: initialRankingValues,
    areaType = "prefecture",
    selectedYear,
    topology,
    sections = {},
    parentAreaCode,
    cityRankingItem,
    surveyName,
    categoryName,
    groupMembers = [],
}: RankingKeyPageClientProps) {
    const {
        activeRankingItem,
        currentAreaType,
        currentYear,
        handleAreaTypeChange,
        handleNormalizationChange,
        handleYearChange,
        isPending,
        normalizationType,
        rankingValues,
    } = useRankingPageState({
        rankingKey,
        rankingItem,
        initialRankingValues,
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

    // 最終更新日とデータ年度の表示用 (SEO freshness)
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
    // 定義 → h1 直下の控えめ行 (HeroCard titleDetail) / 注釈 → チャート直下キャプション。
    const { subtitle: definitionalSubtitle, note: subtitleNote } =
        classifyRankingSubtitle(displayInfo.subtitle);
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
    const rightRail = sections.sidebar ? (
        <aside className="flex flex-col gap-3">
            {sections.sidebar}
            <div className="hidden lg:block">
                <AdSenseAd
                    format={RANKING_PAGE_TABLE_SIDE.format}
                    slotId={RANKING_PAGE_TABLE_SIDE.slotId}
                />
            </div>
        </aside>
    ) : undefined;

    return (
        <PageShell rightRail={rightRail} rightRailBreakpoint="lg">
            {/* ヒーローカード（Option D）: タイトル + 単位ピル + メタ操作 + 暗色スタット */}
            <RankingHeroCard
                categoryName={categoryName}
                title={displayInfo.title}
                titleDetail={[definitionalSubtitle, displayInfo.demographicAttr]
                    .filter(Boolean)
                    .join("・") || null}
                sourceName={sourceObj?.name ?? null}
                yearName={latestYearName}
                updatedAt={formattedUpdated}
                rankingValues={rankingValues}
                unit={displayInfo.unit}
                normalizationOptions={rankingItem.calculation?.normalizationOptions}
                normalizationValue={normalizationType ?? "original"}
                onNormalizationChange={handleNormalizationChange}
                normalizationDisabled={isPending}
                metaControls={metaControls}
                shareButton={
                    <ShareButtons title={displayInfo.title} shareText={shareText} />
                }
            />

            <RankingBasisSwitcher rankingKey={rankingKey} members={groupMembers} />

            <main className="mt-4 flex flex-col gap-4 min-w-0">
                <RankingVisualizationSection
                    rankingItem={rankingItem}
                    activeRankingItem={activeRankingItem}
                    rankingValues={rankingValues}
                    areaType={currentAreaType}
                    topology={topology}
                    headerActions={headerActions}
                    cardFooter={cardFooter}
                    isPending={isPending}
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
            </main>
        </PageShell>
    );
}
