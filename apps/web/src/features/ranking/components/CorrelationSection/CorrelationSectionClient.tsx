"use client";

import Link from "next/link";

import { SectionCard } from "@/components/surface";

interface CorrelatedItem {
    rankingKey: string;
    title: string;
    subtitle: string | null;
    unit: string;
    pearsonR: number;
    populationAdjustedR: number;
    partialRPopulation: number | null;
    partialRArea: number | null;
    partialRAging: number | null;
    partialRDensity: number | null;
    scatterData: Array<{
        areaCode: string;
        areaName: string;
        x: number;
        y: number;
    }>;
}

function formatR(r: number): string {
    const sign = r >= 0 ? "+" : "";
    return `${sign}${r.toFixed(2)}`;
}

function rColor(r: number): string {
    if (r >= 0.7) return "text-red-500";
    if (r >= 0.4) return "text-orange-500";
    if (r <= -0.7) return "text-blue-500";
    if (r <= -0.4) return "text-cyan-500";
    return "text-muted-foreground";
}

interface CorrelationSectionClientProps {
    correlatedItems: CorrelatedItem[];
    /** 相手指標 rankingKey → この 2 指標の関係を解説した記事 */
    articleByPairKey?: Record<string, { slug: string; title: string }>;
}

export function CorrelationSectionClient({
    correlatedItems,
    articleByPairKey = {},
}: CorrelationSectionClientProps) {
    return (
        <SectionCard title="相関が高い指標">
            {/* 並び順と数値は snapshot の populationAdjustedR。生の r だと人口規模だけで連動する実数同士が上位を占める */}
            <p className="mb-2 text-xs text-muted-foreground">
                人口規模の影響を除いた相関係数
            </p>
            <nav className="flex flex-col">
                {correlatedItems.map((item) => {
                    const article = articleByPairKey[item.rankingKey];
                    return (
                        <div key={item.rankingKey} className="flex items-center justify-between gap-2 py-1.5">
                            <Link
                                href={`/ranking/${item.rankingKey}`}
                                className="truncate text-sm hover:text-primary transition-colors"
                            >
                                {item.title}
                            </Link>
                            <span className="flex shrink-0 items-center gap-3">
                                {article && (
                                    <Link
                                        href={`/blog/${article.slug}`}
                                        title={article.title}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        解説記事
                                    </Link>
                                )}
                                <span className={`font-mono text-xs tabular-nums ${rColor(item.populationAdjustedR)}`}>
                                    {formatR(item.populationAdjustedR)}
                                </span>
                            </span>
                        </div>
                    );
                })}
            </nav>
        </SectionCard>
    );
}
