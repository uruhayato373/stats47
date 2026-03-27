"use client";

import dynamic from "next/dynamic";
import type { ScatterplotDataNode, ScatterplotProps } from "@stats47/visualization/d3";
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { type ScatterPlotConfig } from "../../types/chart-config.types";
import { useChartData } from "../../hooks/useChartData";
import { ChartWithFallback } from "./ChartWithFallback";

const ScatterPlot = dynamic<ScatterplotProps>(
    () => import("@stats47/visualization/d3").then((mod) => mod.Scatterplot),
    { ssr: false }
);

export function BlogScatterPlot(props: ScatterPlotConfig) {
    const { data, meta, isLoading } = useChartData<ScatterplotDataNode[]>(props.dataPath);

    return (
        <Card className="w-full border border-border shadow-sm rounded-sm">
            {meta?.title && (
                <CardHeader>
                    <CardTitle>{meta.title}</CardTitle>
                </CardHeader>
            )}
            <CardContent className="p-4">
                <ChartWithFallback fallbackImage={props.fallbackImage}>
                    <ScatterPlot
                        data={data ?? []}
                        xLabel={meta?.xLabel ?? props.xLabel}
                        yLabel={meta?.yLabel ?? props.yLabel}
                        title={undefined}
                        isLoading={isLoading}
                        className={props.className}
                    />
                </ChartWithFallback>
            </CardContent>
        </Card>
    );
}
