"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";
import { Badge } from "@stats47/components/atoms/ui/badge";
import type { RankingItem } from "@stats47/ranking";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface CorrelatedItem {
    rankingKey: string;
    title: string;
    subtitle: string | null;
    unit: string;
    pearsonR: number;
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

/** 4つの偏相関係数のうち最も厳しい（最小の絶対値）を返す */
function getEffectivePartialR(item: CorrelatedItem): number | null {
    const values = [
        item.partialRPopulation,
        item.partialRArea,
        item.partialRAging,
        item.partialRDensity,
    ].filter((v): v is number => v !== null);
    if (values.length === 0) return null;
    return Math.min(...values.map(Math.abs));
}

/** 疑似相関の主要因を特定するラベルを返す */
function getSpuriousLabel(item: CorrelatedItem): string | null {
    if (Math.abs(item.pearsonR) < 0.7) return null;
    const effectiveR = getEffectivePartialR(item);
    if (effectiveR === null || effectiveR >= 0.5) return null;

    const factors: { label: string; r: number | null }[] = [
        { label: "人口規模", r: item.partialRPopulation },
        { label: "面積", r: item.partialRArea },
        { label: "高齢化率", r: item.partialRAging },
        { label: "人口密度", r: item.partialRDensity },
    ];
    let minFactor = factors[0];
    for (const f of factors) {
        if (f.r !== null && (minFactor.r === null || Math.abs(f.r) < Math.abs(minFactor.r!))) {
            minFactor = f;
        }
    }
    return `${minFactor.label}の影響が大きい可能性`;
}

function formatPearsonR(r: number): string {
    const sign = r >= 0 ? "+" : "";
    return `${sign}${r.toFixed(3)}`;
}

function getCorrelationLabel(r: number): { text: string; className: string } {
    if (r >= 0.7) return { text: "強い正の相関", className: "text-red-600 dark:text-red-400" };
    if (r >= 0.4) return { text: "正の相関", className: "text-orange-600 dark:text-orange-400" };
    if (r > 0) return { text: "弱い正の相関", className: "text-yellow-600 dark:text-yellow-400" };
    if (r <= -0.7) return { text: "強い負の相関", className: "text-blue-600 dark:text-blue-400" };
    if (r <= -0.4) return { text: "負の相関", className: "text-cyan-600 dark:text-cyan-400" };
    return { text: "弱い負の相関", className: "text-teal-600 dark:text-teal-400" };
}

interface CorrelationSectionClientProps {
    rankingKey: string;
    rankingItem: RankingItem;
    correlatedItems: CorrelatedItem[];
}

export function CorrelationSectionClient({
    rankingKey,
    correlatedItems,
}: CorrelationSectionClientProps) {
    return (
        <Card className="border border-border shadow-sm rounded-sm">
            <CardHeader>
                <CardTitle>相関が高い指標</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="divide-y">
                    {correlatedItems.map((item) => {
                        const label = getCorrelationLabel(item.pearsonR);
                        const spuriousLabel = getSpuriousLabel(item);
                        return (
                            <li key={item.rankingKey}>
                                <Link
                                    href={`/ranking/${item.rankingKey}`}
                                    className="flex items-center gap-3 py-3 px-2 rounded-md hover:bg-muted transition-colors group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                                {item.title}
                                                {item.subtitle && (
                                                    <span className="text-muted-foreground ml-1">
                                                        ({item.subtitle})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-xs font-medium ${label.className}`}>
                                                {label.text}
                                            </span>
                                            {spuriousLabel && (
                                                <span className="text-xs text-amber-600 dark:text-amber-400">
                                                    ※{spuriousLabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Badge
                                        variant={Math.abs(item.pearsonR) >= 0.7 ? "default" : "secondary"}
                                        className="shrink-0 font-mono text-xs"
                                    >
                                        r={formatPearsonR(item.pearsonR)}
                                    </Badge>
                                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
                <div className="mt-3 pt-3 border-t">
                    <Link
                        href={`/correlation?x=${rankingKey}`}
                        className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors"
                    >
                        相関分析の詳細を見る →
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
