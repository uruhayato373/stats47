"use client";

import dynamic from "next/dynamic";

import { ChartPanel } from "@/components/charts/ChartPanel";

import { useChartData } from "../../hooks/useChartData";
import { type ScatterPlotConfig } from "../../types/chart-config.types";

import { ChartWithFallback } from "./ChartWithFallback";

import type { ScatterplotDataNode, ScatterplotProps } from "@stats47/visualization/d3";

const ScatterPlot = dynamic<ScatterplotProps>(
    () => import("@stats47/visualization/d3/Scatterplot").then((mod) => mod.Scatterplot),
    { ssr: false }
);

export function BlogScatterPlot(props: ScatterPlotConfig) {
    const { data, meta, isLoading } = useChartData<ScatterplotDataNode[]>(props.dataPath);

    return (
        <ChartPanel title={meta?.title}>
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
        </ChartPanel>
    );
}
