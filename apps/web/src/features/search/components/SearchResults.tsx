"use client";

import { Fragment } from "react";

import { Badge } from "@stats47/components/atoms/ui/badge";
import { BarChart3, FileText } from "lucide-react";

import { SurfaceLinkCard } from "@/components/surface";

import { AdRow, composeAdRows, InFeedAdSlot } from "@/features/ads";

import { trackSearchResultClick } from "@/lib/analytics/events";
import { SEARCH_INFEED, SEARCH_ROW_1, SEARCH_ROW_2, SEARCH_ROW_3 } from "@/lib/google-adsense";


import type { ContentType, SearchResult } from "../types";

/**
 * 結果の一覧の広告の段 (2026-11-12 オーナー決定)。結果を全件 1 ページに並べるので (「人口」で 314 件・スマホで約 58,000px)、
 * 5 件目・30 件目・60 件目の後に AdSense 1 つを本文の幅いっぱい (上限 580px) に出す。スマホで間は約 4,500px。
 * 段の後に結果が MIN_RESULTS_AFTER_AD_ROW 件以上続くときだけ出し、ページの最後の広告 (FooterAdSlot) と隣り合わせない。
 * ユニットは段ごとに検索専用 (同日に作成)
 */
const SEARCH_AD_ROW_AFTER = [5, 30, 60] as const;
const MIN_RESULTS_AFTER_AD_ROW = 3;
const SEARCH_AD_ROWS = composeAdRows([['adsense'], ['adsense'], ['adsense']], [SEARCH_ROW_1, SEARCH_ROW_2, SEARCH_ROW_3], []);
/**
 * 60 件目より後は 30 件ごと (90・120・150 … 件目の後) にインフィード広告を繰り返す (2026-11-13 オーナー決定)。
 * 「人口」で 60 件目の後からページの最後まで約 48,000px 広告が無かった。最後の 3 件より後ろには置かない
 */
const SEARCH_INFEED_START = 90;
const SEARCH_INFEED_EVERY = 30;
const isSearchInfeedPosition = (position: number) =>
    position >= SEARCH_INFEED_START && (position - SEARCH_INFEED_START) % SEARCH_INFEED_EVERY === 0;

interface SearchResultsProps {
    results: SearchResult[];
    query: string;
}

const typeIcons: Record<ContentType, React.ReactNode> = {
    blog: <FileText className="h-4 w-4" />,
    ranking: <BarChart3 className="h-4 w-4" />,
    "municipality-ranking": <BarChart3 className="h-4 w-4" />,
};

const typeBadgeVariants: Record<ContentType, "default" | "secondary" | "outline"> = {
    blog: "secondary",
    ranking: "outline",
    "municipality-ranking": "outline",
};

const typeLabels: Record<ContentType, string> = {
    blog: "ブログ",
    ranking: "ランキング",
    "municipality-ranking": "市区町村ランキング",
};

export function SearchResults({ results, query }: SearchResultsProps) {
    if (!query) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>検索キーワードを入力してください</p>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-lg font-medium mb-2">
                    「{query}」に一致する結果が見つかりませんでした
                </p>
                <p className="text-muted-foreground">
                    別のキーワードで検索してみてください
                </p>
            </div>
        );
    }

    // 線の格子のセルとして返す (件数の文章が 1 セル、各結果が 1 セル)。並べる格子は SearchPageClient が持つ
    return (
        <>
            <p className="text-sm text-muted-foreground">
                「{query}」の検索結果: {results.length}件
            </p>

            {results.map((result, index) => {
                const rowIndex = SEARCH_AD_ROW_AFTER.indexOf(index + 1 as (typeof SEARCH_AD_ROW_AFTER)[number]);
                const adRow = rowIndex >= 0 && results.length - (index + 1) >= MIN_RESULTS_AFTER_AD_ROW
                    ? SEARCH_AD_ROWS[rowIndex]
                    : undefined;
                return (
                    <Fragment key={result.id}>
                        <div
                            onClickCapture={() =>
                                trackSearchResultClick({ resultType: result.type, resultPosition: index + 1 })
                            }
                        >
                            {result.type !== "blog" ? (
                                <RankingResultCard result={result} />
                            ) : (
                                <BlogResultCard result={result} />
                            )}
                        </div>
                        {adRow && adRow.length > 0 && (
                            <AdRow cells={adRow} position={`search-row-${rowIndex + 1}`} trackingCategory="search" wide />
                        )}
                        {isSearchInfeedPosition(index + 1) && results.length - (index + 1) >= MIN_RESULTS_AFTER_AD_ROW && (
                            <InFeedAdSlot slot={SEARCH_INFEED} />
                        )}
                    </Fragment>
                );
            })}
        </>
    );
}

/**
 * ランキング検索結果カード
 * タイトル・サブタイトル・年度・属性・基準を表示
 */
function RankingResultCard({ result }: { result: SearchResult }) {
    return (
        <SurfaceLinkCard href={result.url} className="block p-0 group hover:bg-muted/50">
                <div className="pb-2 pt-4 px-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                            <div className="text-muted-foreground mt-0.5 shrink-0">
                                {typeIcons[result.type]}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-semibold group-hover:text-primary transition-colors leading-snug">
                                    {result.title}
                                </h3>
                                {result.subtitle && (
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {result.subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Badge variant={typeBadgeVariants[result.type]} className="shrink-0 text-xs">
                            {typeLabels[result.type]}
                        </Badge>
                    </div>
                </div>
                <div className="pb-3 px-4 pt-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground ml-6">
                        {result.latestYear && (
                            <span className="font-medium text-foreground">{result.latestYear}</span>
                        )}
                        {result.demographicAttr && (
                            <span>{result.demographicAttr}</span>
                        )}
                        {result.normalizationBasis && (
                            <span>{result.normalizationBasis}</span>
                        )}
                        {result.category && (
                            <span className="text-muted-foreground/70">
                                {result.category}
                            </span>
                        )}
                    </div>
                </div>
        </SurfaceLinkCard>
    );
}

/**
 * ブログ検索結果カード
 */
function BlogResultCard({ result }: { result: SearchResult }) {
    return (
        <SurfaceLinkCard href={result.url} className="block p-0 group hover:bg-muted/50">
                <div className="pb-2 pt-4 px-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                            <div className="text-muted-foreground mt-0.5 shrink-0">
                                {typeIcons[result.type]}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-semibold group-hover:text-primary transition-colors leading-snug">
                                    {result.title}
                                </h3>
                                {result.category && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {result.category}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Badge variant={typeBadgeVariants[result.type]} className="shrink-0 text-xs">
                            {typeLabels[result.type]}
                        </Badge>
                    </div>
                </div>
                <div className="pb-3 px-4 pt-3">
                    <p className="text-sm text-muted-foreground ml-6 line-clamp-2">
                        {result.description}
                    </p>
                    {result.tags && result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 ml-6">
                            {result.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {result.publishedAt && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                            {result.publishedAt.slice(0, 10)}
                        </p>
                    )}
                </div>
        </SurfaceLinkCard>
    );
}
