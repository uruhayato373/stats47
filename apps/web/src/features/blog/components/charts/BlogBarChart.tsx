"use client";

import dynamic from "next/dynamic";
import type { ChartDataNode, BarChartProps } from "@stats47/visualization/d3";
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { type BarChartConfig } from "../../types/chart-config.types";
import { useChartData } from "../../hooks/useChartData";
import { ChartWithFallback } from "./ChartWithFallback";

const BarChart = dynamic<BarChartProps>(
    () => import("@stats47/visualization/d3/BarChart").then((mod) => mod.BarChart),
    { ssr: false }
);

export function BlogBarChart(props: BarChartConfig) {
    const { data, meta, isLoading } = useChartData<ChartDataNode[]>(props.dataPath);

    return (
        <Card className="w-full border border-border shadow-sm rounded-sm">
            {meta?.title && (
                <CardHeader>
                    <CardTitle>{meta.title}</CardTitle>
                </CardHeader>
            )}
            <CardContent className="p-4">
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
            </CardContent>
        </Card>
    );
}
