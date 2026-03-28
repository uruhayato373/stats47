"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import dynamic from "next/dynamic";

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

import { fetchCorrelationPairAction, type CorrelationPairResult } from "../actions";
import { calculateRegression, updateUrlParams } from "../utils";

import { CorrelationExplanation } from "./CorrelationExplanation";
import { CorrelationRanking } from "./CorrelationRanking";
import { PartialCorrelationDisplay } from "./PartialCorrelationDisplay";

import type { TopCorrelation } from "@stats47/correlation/server";
import type { ScatterplotDataNode } from "@stats47/visualization/d3";

const Scatterplot = dynamic(
  () => import("@stats47/visualization/d3/Scatterplot").then((m) => m.Scatterplot),
  { ssr: false },
);

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
    // デフォルトでランキング1位を表示
    const defaultX = initialX ?? topCorrelations[0]?.rankingKeyX ?? "";
    const defaultY = initialY ?? topCorrelations[0]?.rankingKeyY ?? "";
    const [selectedX, setSelectedX] = useState(defaultX);
    const [selectedY, setSelectedY] = useState(defaultY);
    const [correlationData, setCorrelationData] = useState<CorrelationPairResult | null>(
        initialData ?? null
    );
    const [isPending, startTransition] = useTransition();

    const optionX = rankingOptions.find((o) => o.rankingKey === selectedX);
    const optionY = rankingOptions.find((o) => o.rankingKey === selectedY);

    useEffect(() => {
        if (!selectedX || !selectedY || selectedX === selectedY) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- reset data when selection invalid
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
                <h1 className="text-lg font-bold">都道府県統計の相関分析</h1>
            </div>

            {/* 指標セレクター */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* モバイル: ランキングを散布図の上に表示 */}
                <div className="lg:hidden">
                    <CorrelationRanking
                        topCorrelations={topCorrelations}
                        totalPairs={totalPairs}
                        strongCorrelationCount={strongCorrelationCount}
                        onSelect={handleRankingSelect}
                    />
                </div>

                {/* メインエリア */}
                <div className="lg:col-span-8 space-y-6">
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
                                <CardTitle className="text-base">
                                    {optionX && formatLabel(optionX)} vs{" "}
                                    {optionY && formatLabel(optionY)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {correlationData ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-baseline gap-3 text-sm">
                                            <span className="text-lg font-bold font-mono">
                                                r = {correlationData.pearsonR >= 0 ? "+" : ""}
                                                {correlationData.pearsonR.toFixed(4)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                R² = {r2?.toFixed(4)} / n = {correlationData.scatterData.length}
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
                </div>

                {/* デスクトップ: サイドバー */}
                <div className="hidden lg:block lg:col-span-4">
                    <CorrelationRanking
                        topCorrelations={topCorrelations}
                        totalPairs={totalPairs}
                        strongCorrelationCount={strongCorrelationCount}
                        onSelect={handleRankingSelect}
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
