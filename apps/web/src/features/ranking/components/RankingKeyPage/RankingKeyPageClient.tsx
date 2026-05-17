"use client";

import { ReactNode, useEffect, useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@stats47/components/atoms/ui/tabs";
import {
    type RankingItem,
    type RankingValue,
    buildRankingDisplayInfo,
} from "@stats47/ranking";
import { isOk, type TopoJSONTopology } from "@stats47/types";
import { Map as MapIcon, Table as TableIcon } from "lucide-react";

import { ShareButtons } from "@/components/molecules/ShareButtons";


import type { AreaType } from "@/features/area";
import {
    RankingDataTable,
    RankingDefinitionCard,
    RankingMapChartClient,
    RankingSourceCard,
    RankingYearSelector,
    AreaTypeToggle,
    DataDownloadIconButton,
    NormalizationToggle,
} from "@/features/ranking";

import { trackRankingView, trackYearChange, trackAreaTypeChange } from "@/lib/analytics/events";
import {
    AdSenseAd,
    RANKING_PAGE_TABLE_SIDE,
    RANKING_PAGE_FOOTER,
} from "@/lib/google-adsense";

import { useBreakpoint } from "@/hooks/useBreakpoint";

import { fetchRankingValuesAction } from "../../actions/fetch-ranking-values";

/** グループメンバー（normalization_basis トグル用） */
interface GroupMember {
    rankingKey: string;
    title: string;
    subtitle: string | null;
    unit: string;
    normalizationBasis: string | null;
}

interface RankingKeyPageClientProps {
    rankingKey: string;
    rankingItem: RankingItem;
    rankingValues: RankingValue[];
    areaType?: AreaType;
    selectedYear?: string;
    topology?: TopoJSONTopology | null;
    correlationSection?: ReactNode;
    rankingPageCards?: ReactNode;
    insightsSection?: ReactNode;
    regionalAnalysisSection?: ReactNode;
    faqSection?: ReactNode;
    /** 47 都道府県別の解説セクション (SEO 長尾) */
    prefectureCommentarySection?: ReactNode;
    /** 都道府県コード（市区町村ランキング時のフィルタ用） */
    parentAreaCode?: string;
    /** 右サイドバーに表示するコンテンツ（Server Component を注入） */
    sidebarSection?: ReactNode;
    /** 市区町村ランキング定義（存在する場合にトグルを表示） */
    cityRankingItem?: RankingItem;
    /** 調査名（surveys テーブルから取得） */
    surveyName?: string;
    /** グループメンバー（normalization_basis トグル用） */
    groupMembers?: GroupMember[];
}

export function RankingKeyPageClient({
    rankingKey,
    rankingItem,
    rankingValues: initialRankingValues,
    areaType = "prefecture",
    selectedYear,
    topology,
    correlationSection,
    rankingPageCards,
    insightsSection,
    regionalAnalysisSection,
    faqSection,
    prefectureCommentarySection,
    parentAreaCode,
    sidebarSection,
    cityRankingItem,
    surveyName,
    groupMembers = [],
}: RankingKeyPageClientProps) {
    const [rankingValues, setRankingValues] = useState<RankingValue[]>(initialRankingValues);
    const [currentYear, setCurrentYear] = useState(selectedYear ?? "");
    const [normalizationType, setNormalizationType] = useState<string | undefined>(undefined);
    const [currentAreaType, setCurrentAreaType] = useState<AreaType>(areaType ?? "prefecture");
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const isBelowLg = useBreakpoint("belowLg");
    const isAboveXl = useBreakpoint("aboveXl");

    // ランキングページ閲覧イベント
    useEffect(() => {
        trackRankingView({
            rankingKey,
            title: rankingItem.title,
            categoryKey: rankingItem.categoryKey,
            areaType: currentAreaType,
            yearCode: currentYear,
        });
    }, [rankingKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // 現在の areaType に応じたランキング定義
    const activeRankingItem = currentAreaType === "city" && cityRankingItem
        ? cityRankingItem
        : rankingItem;

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

    const buildUrl = (year: string, area: AreaType, norm?: string) => {
        const params = new URLSearchParams();
        if (year) params.set("year", year);
        if (area !== "prefecture") params.set("areaType", area);
        if (norm) params.set("norm", norm);
        const qs = params.toString();
        return qs ? `${pathname}?${qs}` : pathname;
    };

    const handleYearChange = (newYear: string) => {
        trackYearChange({ rankingKey, fromYear: currentYear, toYear: newYear });
        setCurrentYear(newYear);
        window.history.replaceState(null, "", buildUrl(newYear, currentAreaType, normalizationType));
        startTransition(async () => {
            const result = await fetchRankingValuesAction(
                rankingKey,
                currentAreaType,
                newYear,
                normalizationType,
                parentAreaCode,
            );
            if (isOk(result)) {
                setRankingValues(result.data);
            }
        });
    };

    const handleAreaTypeChange = (newAreaType: AreaType) => {
        trackAreaTypeChange({ rankingKey, areaType: newAreaType });
        setCurrentAreaType(newAreaType);

        // 切替先の rankingItem に基づいて年度を決定
        const targetItem = newAreaType === "city" && cityRankingItem
            ? cityRankingItem
            : rankingItem;
        const targetYears = targetItem.availableYears || [];
        // 現在の年度が切替先に存在すればそのまま、なければ最新年度
        const yearExists = targetYears.some((y) => y.yearCode === currentYear);
        const newYear = yearExists ? currentYear : (targetYears[0]?.yearCode || currentYear);
        setCurrentYear(newYear);

        window.history.replaceState(null, "", buildUrl(newYear, newAreaType));
        startTransition(async () => {
            const result = await fetchRankingValuesAction(
                rankingKey,
                newAreaType,
                newYear,
                normalizationType,
                parentAreaCode,
            );
            if (isOk(result)) {
                setRankingValues(result.data);
            }
        });
    };

    // ブックマーク・共有URL対応: ?year= / ?areaType= / ?norm= パラメータからデータ取得
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlYear = params.get("year");
        const urlAreaType = params.get("areaType") as AreaType | null;
        const urlNorm = params.get("norm") ?? undefined;

        if (urlNorm) {
            setNormalizationType(urlNorm);
        }

        if (urlAreaType === "city" && cityRankingItem) {
            setCurrentAreaType("city");
            const targetYears = cityRankingItem.availableYears || [];
            const year = urlYear || targetYears[0]?.yearCode || "";
            if (year !== selectedYear || urlAreaType !== areaType) {
                setCurrentYear(year);
                startTransition(async () => {
                    const result = await fetchRankingValuesAction(rankingKey, "city", year, urlNorm, parentAreaCode);
                    if (isOk(result)) setRankingValues(result.data);
                });
            }
        } else if (urlYear && urlYear !== selectedYear) {
            // year と norm が同時に指定されている場合、両方を一度のリクエストで処理する
            setCurrentYear(urlYear);
            window.history.replaceState(null, "", buildUrl(urlYear, currentAreaType, urlNorm));
            startTransition(async () => {
                const result = await fetchRankingValuesAction(
                    rankingKey,
                    currentAreaType,
                    urlYear,
                    urlNorm,
                    parentAreaCode,
                );
                if (isOk(result)) setRankingValues(result.data);
            });
        } else if (urlNorm) {
            startTransition(async () => {
                if (!currentYear) return;
                const result = await fetchRankingValuesAction(rankingKey, currentAreaType, currentYear, urlNorm, parentAreaCode);
                if (isOk(result)) setRankingValues(result.data);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const shareText = useMemo(() => {
        const top = rankingValues.find((v) => v.rank === 1);
        if (!top) return undefined;
        return `${displayInfo.title}、1位は${top.areaName}！ あなたの県は何位？ #stats47`;
    }, [rankingValues, displayInfo.title]);

    // カードタイトル・サブタイトル・出典を構築
    const sourceObj = (rankingItem?.sourceConfig as Record<string, unknown>)?.source as { name?: string; url?: string } | undefined;
    const cardFooter = (sourceObj?.name || surveyName) ? (
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

    const downloadButton = (
        <DataDownloadIconButton
            rankingKey={rankingKey}
            areaType={areaType}
            displayInfo={displayInfo}
        />
    );

    const headerActions = (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
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
            </div>
            {downloadButton}
        </div>
    );

    const handleNormalizationChange = (value: string) => {
        const nextType = value === "original" ? undefined : value;
        setNormalizationType(nextType);

        const params = new URLSearchParams(window.location.search);
        if (nextType) {
            params.set("norm", nextType);
        } else {
            params.delete("norm");
        }
        const qs = params.toString();
        window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);

        startTransition(async () => {
            if (!currentYear) return;
            const result = await fetchRankingValuesAction(
                rankingKey,
                currentAreaType,
                currentYear,
                nextType,
                parentAreaCode,
            );
            if (isOk(result)) {
                setRankingValues(result.data);
            }
        });
    };

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

    return (
        <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">
                {displayInfo.title}
                {(() => {
                    const detail = [displayInfo.subtitle, displayInfo.demographicAttr].filter(Boolean).join("・");
                    return detail ? <span className="text-muted-foreground font-normal">（{detail}）</span> : null;
                })()}
            </h1>

            {/* データ年度 + 最終更新日 (SEO freshness + UX) */}
            {(formattedUpdated || latestYearName) && (
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {latestYearName && <span>データ年度: {latestYearName}</span>}
                    {formattedUpdated && (
                        <span>
                            最終更新:{" "}
                            <time dateTime={rankingItem.updatedAt ?? formattedUpdated}>
                                {formattedUpdated}
                            </time>
                        </span>
                    )}
                </p>
            )}

            {/* normalization_basis グループトグル（別URL切替）*/}
            {groupMembers.length > 1 && (
                <div className="flex items-center gap-0.5 mt-2 w-fit">
                    {[...groupMembers].sort((a, b) => (a.normalizationBasis ? 1 : 0) - (b.normalizationBasis ? 1 : 0)).map((member) => {
                        const isCurrent = member.rankingKey === rankingKey;
                        const label = member.normalizationBasis || "総数";
                        return isCurrent ? (
                            <span
                                key={member.rankingKey}
                                className="text-xs px-2.5 pb-1 border-b-2 border-primary text-foreground font-medium"
                            >
                                {label}
                            </span>
                        ) : (
                            <Link
                                key={member.rankingKey}
                                href={`/ranking/${member.rankingKey}`}
                                className="text-xs px-2.5 pb-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors"
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* 正規化トグル（同一ページ内で per_population / per_area に切替） */}
            {rankingItem.calculation?.normalizationOptions && rankingItem.calculation.normalizationOptions.length > 0 && (
                <div className="mt-2">
                    <NormalizationToggle
                        options={rankingItem.calculation.normalizationOptions}
                        value={normalizationType ?? "original"}
                        onChange={handleNormalizationChange}
                        disabled={isPending}
                    />
                </div>
            )}

            {/* メインコンテンツ + 右サイドバー (CSS のみで切替: JS ハイドレーション由来の CLS を防ぐ) */}
            <div className="mt-4 lg:flex lg:gap-4 lg:items-start">
            <main className="flex flex-col gap-4 min-w-0 flex-1">
                    {/* 地図＋データテーブル */}
                    {isBelowLg ? (
                        /* モバイル: タブ切替（デフォルト table: Leaflet タイルを LCP 要素から除外） */
                        <Tabs defaultValue="table" className="w-full">
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="map" className="flex items-center gap-1.5">
                                    <MapIcon className="w-4 h-4" />
                                    地図
                                </TabsTrigger>
                                <TabsTrigger value="table" className="flex items-center gap-1.5">
                                    <TableIcon className="w-4 h-4" />
                                    テーブル
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="map" className="mt-4">
                                <RankingMapChartClient
                                    rankingItem={activeRankingItem}
                                    rankingValues={rankingValues}
                                    areaType={currentAreaType}
                                    topology={topology ?? null}
                                    headerActions={headerActions}
                                    cardFooter={cardFooter}
                                />
                            </TabsContent>
                            <TabsContent value="table" className="mt-4">
                                <RankingDataTable
                                    rankingValues={rankingValues}
                                    rankingItem={rankingItem}
                                    headerActions={headerActions}
                                    cardFooter={cardFooter}
                                />
                            </TabsContent>
                        </Tabs>
                    ) : (
                        /* デスクトップ: xl以上は地図+テーブル2列、lg〜xl未満は縦並び */
                        <div className={`relative ${isAboveXl ? "grid grid-cols-2 gap-4 items-start" : "flex flex-col gap-4"}`}>
                            {isPending && (
                                <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-[1px]">
                                    <Skeleton className="w-full h-full opacity-50" />
                                </div>
                            )}
                            <RankingMapChartClient
                                rankingItem={activeRankingItem}
                                rankingValues={rankingValues}
                                areaType={currentAreaType}
                                topology={topology ?? null}
                                headerActions={headerActions}
                                cardFooter={cardFooter}
                            />
                            <RankingDataTable
                                rankingValues={rankingValues}
                                rankingItem={rankingItem}
                                headerActions={headerActions}
                                cardFooter={cardFooter}
                            />
                        </div>
                    )}

                    {/* シェアボタン（テーブル直下） */}
                    <div className="flex justify-center py-2">
                        <ShareButtons
                            title={displayInfo.title}
                            shareText={shareText}
                        />
                    </div>

                    {/* 広告: テーブル読了後 */}
                    <AdSenseAd
                        format={RANKING_PAGE_FOOTER.format}
                        slotId={RANKING_PAGE_FOOTER.slotId}
                    />

                    {/* データの考察（折りたたみ） */}
                    {insightsSection}

                    {/* よくある質問（折りたたみ）+ JSON-LD */}
                    {faqSection}

                    {/* 箱ひげ図（地域別分布）— 現在非表示。コンポーネントは維持 */}
                    {/* <RankingBoxplotChart
                        rankingValues={rankingValues}
                        unit={displayInfo.unit}
                        decimalPlaces={displayInfo.decimalPlaces}
                        minValueType={rankingItem.visualization?.minValueType}
                    /> */}

                    {/* 地域別の傾向（折りたたみ） */}
                    {regionalAnalysisSection}

                    {/* 都道府県別の解説（折りたたみ、47県、SEO 長尾） */}
                    {prefectureCommentarySection}

                    {/* 相関分析セクション */}
                    {correlationSection}

                    {/* ランキングページカード（補足チャート） */}
                    {rankingPageCards}

                    {/* 統計の定義 */}
                    {displayInfo.description && (
                        <RankingDefinitionCard
                            definition={displayInfo.description}
                            itemDetail={rankingItem}
                        />
                    )}

                    {/* 出典情報 */}
                    {rankingItem?.source && (
                        <RankingSourceCard source={rankingItem.source} />
                    )}

                </main>

                {/* 右サイドバー: CSS で lg 以上のみ表示 (JS 判定廃止 → CLS 防止) */}
                {sidebarSection && (
                    <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:sticky lg:top-20">
                        <div className="flex flex-col gap-4">
                            {sidebarSection}
                            <AdSenseAd
                                format={RANKING_PAGE_TABLE_SIDE.format}
                                slotId={RANKING_PAGE_TABLE_SIDE.slotId}
                            />
                        </div>
                    </aside>
                )}
            </div>

            {/* サイドバーの内容をモバイル・タブレットではページ下部に表示 (CSS で lg 未満のみ) */}
            {sidebarSection && (
                <div className="mt-4 flex flex-col gap-4 lg:hidden">
                    {sidebarSection}
                </div>
            )}
        </div>
    );
}
