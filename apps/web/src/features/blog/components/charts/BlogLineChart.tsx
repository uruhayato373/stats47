"use client";

import dynamic from "next/dynamic";

import { ChartPanel } from "@/components/charts/ChartPanel";

import { useChartData } from "../../hooks/useChartData";
import { type LineChartConfig } from "../../types/chart-config.types";

import { ChartWithFallback } from "./ChartWithFallback";

import type { TimeSeriesDataNode, D3LineChartProps } from "@stats47/visualization/d3";

const LineChart = dynamic<D3LineChartProps>(
    () => import("@stats47/visualization/d3/LineChart").then((mod) => mod.D3LineChart),
    { ssr: false }
);

export function BlogLineChart(props: LineChartConfig) {
    const { data, meta, isLoading } = useChartData<TimeSeriesDataNode[]>(props.dataPath);

    return (
        <ChartPanel title={meta?.title}>
            <ChartWithFallback fallbackImage={props.fallbackImage}>
                <LineChart
                    data={data ?? []}
                    unit={meta?.unit ?? props.unit}
                    title={undefined}
                    isLoading={isLoading}
                    className={props.className}
                />
            </ChartWithFallback>
        </ChartPanel>
    );
}
