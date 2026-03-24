"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@stats47/components/atoms/ui/select";
import { Loader2 } from "lucide-react";
import type { ScatterplotDataNode } from "@stats47/visualization/d3";
import { Scatterplot } from "@stats47/visualization/d3";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { TopCorrelation } from "@stats47/correlation/server";
import { fetchCorrelationPairAction, type CorrelationPairResult } from "../actions";
import { calculateRegression } from "../utils/calculate-regression";
import { updateUrlParams } from "../utils/update-url-params";
import { CorrelationRanking } from "./CorrelationRanking";
import { CorrelationStats } from "./CorrelationStats";
import { CorrelationExplanation } from "./CorrelationExplanation";
import { PartialCorrelationDisplay } from "./PartialCorrelationDisplay";

interface RankingOption {
    rankingKey: string;
    title: string;
    subtitle: string | null | undefined;
    unit: string;
}

interface CorrelationPageClientProps {
    rankingOptions: RankingOption[];
    topCorrelations: TopCorrelation[];
    totalPairs: number;
    strongCorrelationCount: number;
    initialX?: string;
    initialY?: string;
    initialData?: CorrelationPairResult | null;
}

function formatLabel(option: RankingOption): string {
    return option.subtitle
        ? `${option.title} (${option.subtitle})`
        : option.title;
}

export function CorrelationPageClient({
    rankingOptions,
    topCorrelations,
    totalPairs,
    strongCorrelationCount,
    initialX,
    initialY,
    initialData,
}: CorrelationPageClientProps) {
    const [selectedX, setSelectedX] = useState(initialX ?? "");
    const [selectedY, setSelectedY] = useState(initialY ?? "");
    const [correlationData, setCorrelationData] = useState<CorrelationPairResult | null>(
        initialData ?? null
    );
    const [isPending, startTransition] = useTransition();

    const optionX = rankingOptions.find((o) => o.rankingKey === selectedX);
    const optionY = rankingOptions.find((o) => o.rankingKey === selectedY);

    useEffect(() => {
        if (!selectedX || !selectedY || selectedX === selectedY) {
            setCorrelationData(null);
            return;
        }

        if (selectedX === initialX && selectedY === initialY && initialData !== undefined) {
            return;
        }

        startTransition(async () => {
            const result = await fetchCorrelationPairAction(selectedX, selectedY);
            setCorrelationData(result);
        });
    }, [selectedX, selectedY, initialX, initialY, initialData]);

    const handleRankingSelect = useCallback(
        (keyX: string, keyY: string) => {
            setSelectedX(keyX);
            setSelectedY(keyY);
            updateUrlParams(keyX, keyY);
        },
        []
    );

    const scatterData: ScatterplotDataNode[] = useMemo(
        () =>
            correlationData?.scatterData.map((p) => ({
                x: p.x,
                y: p.y,
                label: p.areaName,
            })) ?? [],
        [correlationData]
    );

    const regression = useMemo(
        () =>
            correlationData
                ? calculateRegression(correlationData.scatterData)
                : null,
        [correlationData]
    );

    const r2 = correlationData
        ? correlationData.pearsonR * correlationData.pearsonR
        : null;

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">都道府県統計の相関分析</h1>
                <p className="text-sm text-muted-foreground">
                    {totalPairs.toLocaleString()}組の統計指標ペアから、相関の強い組み合わせを発見できます。
                    指標を選んで散布図を表示したり、ランキングから面白い相関を探してみましょう。
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* メインエリア */}
                <div className="lg:col-span-8 space-y-6">
                    {/* 指標セレクター */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                                X軸の指標
                            </label>
                            <Select value={selectedX} onValueChange={(v) => {
                                setSelectedX(v);
                                updateUrlParams(v, selectedY);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="指標を選択..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {rankingOptions.map((opt) => (
                                        <SelectItem key={opt.rankingKey} value={opt.rankingKey}>
                                            {formatLabel(opt)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                                Y軸の指標
                            </label>
                            <Select value={selectedY} onValueChange={(v) => {
                                setSelectedY(v);
                                updateUrlParams(selectedX, v);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="指標を選択..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {rankingOptions.map((opt) => (
                                        <SelectItem key={opt.rankingKey} value={opt.rankingKey}>
                                            {formatLabel(opt)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* 散布図エリア */}
                    {isPending && (
                        <Card>
                            <CardContent className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </CardContent>
                        </Card>
                    )}

                    {!isPending && selectedX && selectedY && selectedX !== selectedY && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {optionX && formatLabel(optionX)} vs{" "}
                                    {optionY && formatLabel(optionY)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {correlationData ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <span>
                                                相関係数 (r):{" "}
                                                <span className="font-mono font-semibold">
                                                    {correlationData.pearsonR >= 0 ? "+" : ""}
                                                    {correlationData.pearsonR.toFixed(4)}
                                                </span>
                                            </span>
                                            <span>
                                                R²:{" "}
                                                <span className="font-mono">
                                                    {r2?.toFixed(4)}
                                                </span>
                                            </span>
                                            <span className="text-muted-foreground">
                                                データポイント: {correlationData.scatterData.length}
                                            </span>
                                        </div>
                                        <PartialCorrelationDisplay data={correlationData} />
                                        <Scatterplot
                                            data={scatterData}
                                            xLabel={optionX?.title}
                                            yLabel={optionY?.title}
                                            r={4}
                                            stroke="hsl(var(--primary))"
                                            fill="hsl(var(--primary))"
                                            strokeOpacity={0.8}
                                            regressionLine={regression ?? undefined}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground py-8 text-center">
                                        この組み合わせの相関データはありません
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {!isPending && selectedX && selectedY && selectedX === selectedY && (
                        <Card>
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                X軸とY軸に異なる指標を選択してください
                            </CardContent>
                        </Card>
                    )}

                    {!selectedX && !selectedY && (
                        <Card>
                            <CardContent className="py-12 text-center text-sm text-muted-foreground">
                                指標を選択するか、右のランキングからペアをクリックしてください
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* サイドバー */}
                <div className="lg:col-span-4 space-y-6">
                    <CorrelationRanking
                        topCorrelations={topCorrelations}
                        onSelect={handleRankingSelect}
                    />
                    <CorrelationStats
                        totalPairs={totalPairs}
                        strongCorrelationCount={strongCorrelationCount}
                    />
                </div>
            </div>

            {/* 解説セクション */}
            <div className="mt-8">
                <CorrelationExplanation />
            </div>
        </div>
    );
}
