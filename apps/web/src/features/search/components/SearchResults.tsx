"use client";

import { Badge } from "@stats47/components/atoms/ui/badge";
import { BarChart3, FileText } from "lucide-react";

import { SurfaceLinkCard } from "@/components/surface";

import type { ContentType, SearchResult } from "../types";

interface SearchResultsProps {
    results: SearchResult[];
    query: string;
}

const typeIcons: Record<ContentType, React.ReactNode> = {
    blog: <FileText className="h-4 w-4" />,
    ranking: <BarChart3 className="h-4 w-4" />,
};

const typeBadgeVariants: Record<ContentType, "default" | "secondary" | "outline"> = {
    blog: "secondary",
    ranking: "outline",
};

const typeLabels: Record<ContentType, string> = {
    blog: "ブログ",
    ranking: "ランキング",
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

    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
                「{query}」の検索結果: {results.length}件
            </p>

            <div className="space-y-3">
                {results.map((result) =>
                    result.type === "ranking" ? (
                        <RankingResultCard key={result.id} result={result} />
                    ) : (
                        <BlogResultCard key={result.id} result={result} />
                    )
                )}
            </div>
        </div>
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
