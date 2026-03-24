"use client";

import { useState } from "react";
import { Badge } from "@stats47/components/atoms/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";
import { Button } from "@stats47/components/atoms/ui/button";
import type { TopCorrelation } from "@stats47/correlation/server";

interface CorrelationRankingProps {
    topCorrelations: TopCorrelation[];
    onSelect: (keyX: string, keyY: string) => void;
}

const INITIAL_DISPLAY = 10;

export function CorrelationRanking({
    topCorrelations,
    onSelect,
}: CorrelationRankingProps) {
    const [showAll, setShowAll] = useState(false);
    const displayed = showAll
        ? topCorrelations
        : topCorrelations.slice(0, INITIAL_DISPLAY);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">相関係数ランキング</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-3 pb-3">
                {displayed.map((item, idx) => (
                    <button
                        key={`${item.rankingKeyX}-${item.rankingKeyY}`}
                        type="button"
                        onClick={() =>
                            onSelect(item.rankingKeyX, item.rankingKeyY)
                        }
                        className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors"
                    >
                        <div className="flex items-start gap-2">
                            <span className="text-muted-foreground text-xs font-mono shrink-0 pt-0.5 w-5 text-right">
                                {idx + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                                <span className="line-clamp-2 text-xs leading-relaxed">
                                    {item.titleX ?? item.rankingKeyX}
                                    {item.normalizationBasisX && (
                                        <span className="text-muted-foreground text-[10px]">
                                            ({item.normalizationBasisX})
                                        </span>
                                    )}
                                    {" × "}
                                    {item.titleY ?? item.rankingKeyY}
                                    {item.normalizationBasisY && (
                                        <span className="text-muted-foreground text-[10px]">
                                            ({item.normalizationBasisY})
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                                <Badge
                                    variant={
                                        item.effectiveR >= 0
                                            ? "default"
                                            : "destructive"
                                    }
                                    className="font-mono text-xs px-1.5"
                                >
                                    {item.effectiveR >= 0 ? "+" : ""}
                                    {item.effectiveR.toFixed(2)}
                                </Badge>
                                {Math.abs(item.pearsonR - item.effectiveR) >= 0.05 && (
                                    <span
                                        className="text-muted-foreground font-mono text-[10px]"
                                        title={`ピアソン相関係数: ${item.pearsonR >= 0 ? "+" : ""}${item.pearsonR.toFixed(4)}`}
                                    >
                                        r={item.pearsonR >= 0 ? "+" : ""}
                                        {item.pearsonR.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
                {!showAll && topCorrelations.length > INITIAL_DISPLAY && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setShowAll(true)}
                    >
                        もっと見る（残り{topCorrelations.length - INITIAL_DISPLAY}件）
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
