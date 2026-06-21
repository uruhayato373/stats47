"use client";

import dynamic from "next/dynamic";

import { ChartPanel } from "@/components/charts/ChartPanel";

import { useChartData } from "../../hooks/useChartData";
import { type BarChartConfig } from "../../types/chart-config.types";

import { ChartWithFallback } from "./ChartWithFallback";

import type { ChartDataNode, BarChartProps } from "@stats47/visualization/d3";

const BarChart = dynamic<BarChartProps>(
    () => import("@stats47/visualization/d3/BarChart").then((mod) => mod.BarChart),
    { ssr: false }
);

export function BlogBarChart(props: BarChartConfig) {
    const { data, meta, isLoading } = useChartData<ChartDataNode[]>(props.dataPath);

    return (
        <ChartPanel title={meta?.title}>
            <ChartWithFallback fallbackImage={props.fallbackImage}>
                <BarChart
                    data={data ?? []}
                    unit={meta?.unit ?? props.unit}
                    xLabel={meta?.xLabel ?? props.xField}
                    yLabel={meta?.yLabel ?? props.yField}
                    title={undefined}
                    isLoading={isLoading}
                    className={props.className}
                />
            </ChartWithFallback>
        </ChartPanel>
    );
}
