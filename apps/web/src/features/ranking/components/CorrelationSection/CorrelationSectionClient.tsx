"use client";

import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";

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
    rankingKey: string;
    correlatedItems: CorrelatedItem[];
}

export function CorrelationSectionClient({
    rankingKey,
    correlatedItems,
}: CorrelationSectionClientProps) {
    return (
        <Card className="border border-border shadow-sm rounded-sm">
            <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    相関が高い指標
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-2">
                <nav className="flex flex-col">
                    {correlatedItems.map((item) => (
                        <Link
                            key={item.rankingKey}
                            href={`/ranking/${item.rankingKey}`}
                            className="flex items-center justify-between py-1.5 text-xs hover:text-primary transition-colors"
                        >
                            <span className="truncate mr-2">{item.title}</span>
                            <span className={`shrink-0 font-mono ${rColor(item.pearsonR)}`}>
                                {formatR(item.pearsonR)}
                            </span>
                        </Link>
                    ))}
                </nav>
                <div className="mt-2 pt-2 border-t">
                    <Link
                        href={`/correlation?x=${rankingKey}`}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                        相関分析の詳細 →
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
