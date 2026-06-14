"use client";

import { ReactNode, useEffect, useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@stats47/components/atoms/ui/select";
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
import { SourceAttribution } from "@/components/molecules/SourceAttribution";


import type { AreaType } from "@/features/area";
import {
    RankingDataTable,
    RankingDefinitionCard,
    RankingMapChartClient,
    RankingSourceCard,
    RankingYearSelector,
    AreaTypeToggle,
    RankingHeroCard,
    DataUsageCard,
    classifyRankingSubtitle,
} from "@/features/ranking";

import { trackRankingView, trackYearChange, trackAreaTypeChange } from "@/lib/analytics/events";
import {
    AdSenseAd,
    RANKING_PAGE_TABLE_SIDE,
    RANKING_PAGE_FOOTER,
    RANKING_INCONTENT_MOBILE,
} from "@/lib/google-adsense";

// useBreakpoint removed from layout-gating (replaced with CSS classes for CLS fix)

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
    /** ネイティブアフィリエイト枠 (D Phase 2) — AI考察カードの直前に表示 */
    nativeAffiliateSection?: ReactNode;
    /** 同カテゴリ関連ランキング grid (内部リンク密度↑、GSC indexation 改善) */
    relatedRankingsSection?: ReactNode;
    /** 都道府県コード（市区町村ランキング時のフィルタ用） */
    parentAreaCode?: string;
    /** 右サイドバーに表示するコンテンツ（Server Component を注入） */
    sidebarSection?: ReactNode;
    /** 市区町村ランキング定義（存在する場合にトグルを表示） */
    cityRankingItem?: RankingItem;
    /** 調査名（surveys テーブルから取得） */
    surveyName?: string;
    /** カテゴリ名（ヒーローカードの eyebrow 表示用） */
    categoryName?: string;
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
    nativeAffiliateSection,
    relatedRankingsSection,
    parentAreaCode,
    sidebarSection,
    cityRankingItem,
    surveyName,
    categoryName,
    groupMembers = [],
}: RankingKeyPageClientProps) {
    const [rankingValues, setRankingValues] = useState<RankingValue[]>(initialRankingValues);
    const [currentYear, setCurrentYear] = useState(selectedYear ?? "");
    const [normalizationType, setNormalizationType] = useState<string | undefined>(undefined);
    const [currentAreaType, setCurrentAreaType] = useState<AreaType>(areaType ?? "prefecture");
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const router = useRouter();
    // NOTE: useBreakpoint removed for layout-gating usages — replaced with CSS-only
    // responsive classes to eliminate post-hydration CLS (desktop 0.264).
    // The hook file is kept because other non-layout consumers may still use it.

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

    return (
        <div className="container mx-auto px-4 py-4">
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

            {/* normalization_basis グループトグル（別URL切替）*/}
            {groupMembers.length > 1 && (() => {
                const sortedMembers = [...groupMembers].sort(
                    (a, b) => (a.normalizationBasis ? 1 : 0) - (b.normalizationBasis ? 1 : 0)
                );
                return (
                    <>
                        {/* モバイル: Select */}
                        <div className="mt-3 sm:hidden">
                            <Select
                                value={rankingKey}
                                onValueChange={(key) => {
                                    if (key !== rankingKey) router.push(`/ranking/${key}`);
                                }}
                            >
                                <SelectTrigger aria-label="表示基準" className="h-9 w-full text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortedMembers.map((member) => (
                                        <SelectItem key={member.rankingKey} value={member.rankingKey}>
                                            {member.normalizationBasis || "総数"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* デスクトップ: テキストタブ */}
                        <div className="hidden sm:flex items-center gap-0.5 mt-3 w-fit">
                            {sortedMembers.map((member) => {
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
                    </>
                );
            })()}

            {/* メインコンテンツ + 右サイドバー (CSS のみで切替: JS ハイドレーション由来の CLS を防ぐ) */}
            <div className="mt-4 lg:flex lg:gap-4 lg:items-start">
            <main className="flex flex-col gap-4 min-w-0 flex-1">
                    {/* 地図＋データテーブル
                        CLS 修正: JS ブレイクポイントフックを廃止し CSS クラスのみで切り替え。
                        SSR HTML に両ブランチを含め、CSS が表示/非表示を決定する。
                        - モバイル (< lg): Tabs コンテナを表示、デスクトップグリッドを非表示
                        - デスクトップ (≥ lg): Tabs コンテナを非表示、デスクトップグリッドを表示
                          - xl 以上: grid-cols-2 (地図+テーブル横並び)
                          - lg 〜 xl: flex-col (縦並び)
                    */}
                    {/* モバイル専用: タブ切替（デフォルト table: Leaflet タイルを LCP 要素から除外） */}
                    <div className="lg:hidden">
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
                    </div>
                    {/* デスクトップ専用: xl以上は地図+テーブル2列、lg〜xl未満は縦並び */}
                    <div className="hidden lg:block">
                        <div className="relative flex flex-col gap-4 xl:grid xl:grid-cols-2 xl:gap-4 xl:items-start">
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
                    </div>

                    {/* データ注釈 (※系): チャート直下に控えめ表示。
                        0 値の意味など読み違い防止の注記をタイトルではなくここに置く。 */}
                    {dataNote && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {dataNote}
                        </p>
                    )}

                    {/* データダウンロード訴求カード「このデータを使う」
                        (R2 事前生成済みファイルを Route Handler 経由で stream。
                         CSV (UTF-8 / Shift_JIS) / JSON / 全基準まとめて に対応) */}
                    <DataUsageCard
                        rankingKey={rankingKey}
                        areaType={currentAreaType}
                        displayInfo={displayInfo}
                        yearCount={activeRankingItem.availableYears?.length}
                        normalizationType={normalizationType}
                        hasAllBases={(rankingItem.calculation?.normalizationOptions?.length ?? 0) > 0}
                    />

                    {/* データの考察（常時表示カード） — 本来テーブル直下で読まれるべき主要コンテンツ */}
                    {insightsSection}

                    {/* 広告: 本文中（モバイル専用）。考察直下 = テーブルと主要コンテンツを読んだ
                        全読者が到達する高 viewability 位置。デスクトップはサイドバー広告でカバー。
                        旧位置（相関分析の後）は折りたたみ 3 セクション下で到達率が低かったため上方移設
                        （収益化マスタープラン P1: モバイル本文中広告 / mobile セグメントで計測）。 */}
                    <div className="lg:hidden">
                        <AdSenseAd
                            format={RANKING_INCONTENT_MOBILE.format}
                            slotId={RANKING_INCONTENT_MOBILE.slotId}
                        />
                    </div>

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

                    {/* 広告: 解析・本文を読了後、関連ランキングの直前に配置 */}
                    <AdSenseAd
                        format={RANKING_PAGE_FOOTER.format}
                        slotId={RANKING_PAGE_FOOTER.slotId}
                    />

                    {/* ネイティブアフィリエイト枠 (D Phase 2) */}
                    {nativeAffiliateSection}

                    {/* 同カテゴリ関連ランキング grid (内部リンク密度↑、ページ末尾の回遊導線) */}
                    {relatedRankingsSection}

                </main>

                {/* 右サイドバー: CSS で lg 以上のみ表示 (JS 判定廃止 → CLS 防止) */}
                {sidebarSection && (
                    <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:w-[300px] lg:shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
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
