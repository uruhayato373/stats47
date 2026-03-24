"use client";

import dynamic from "next/dynamic";
import type { TimeSeriesDataNode, D3LineChartProps } from "@stats47/visualization";
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { type LineChartConfig } from "../../types/chart-config.types";
import { useChartData } from "../../hooks/useChartData";
import { ChartWithFallback } from "./ChartWithFallback";

const LineChart = dynamic<D3LineChartProps>(
    () => import("@stats47/visualization").then((mod) => mod.D3LineChart),
    { ssr: false }
);

export function BlogLineChart(props: LineChartConfig) {
    const { data, meta, isLoading } = useChartData<TimeSeriesDataNode[]>(props.dataPath);

    return (
        <Card className="w-full border border-border shadow-sm rounded-sm">
            {meta?.title && (
                <CardHeader>
                    <CardTitle>{meta.title}</CardTitle>
                </CardHeader>
            )}
            <CardContent className="p-4">
                <ChartWithFallback fallbackImage={props.fallbackImage}>
                    <LineChart
                        data={data ?? []}
                        unit={meta?.unit ?? props.unit}
                        title={undefined}
                        isLoading={isLoading}
                        className={props.className}
                    />
                </ChartWithFallback>
            </CardContent>
        </Card>
    );
}
