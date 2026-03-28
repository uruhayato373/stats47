"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";

import { useChartData } from "../../hooks/useChartData";
import { type ChoroplethMapConfig } from "../../types/chart-config.types";

import { ChartWithFallback } from "./ChartWithFallback";

import type { MapDataPoint, PrefectureMapProps } from "@stats47/visualization/d3";

const ChoroplethMap = dynamic<PrefectureMapProps>(
    () => import("@stats47/visualization/d3/PrefectureMapChart").then((mod) => mod.PrefectureMapChart),
    { ssr: false }
);

export function BlogChoroplethMap(props: ChoroplethMapConfig) {
    const { data, meta, isLoading } = useChartData<MapDataPoint[]>(props.dataPath);

    return (
        <Card className="w-full border border-border shadow-sm rounded-sm">
            {meta?.title && (
                <CardHeader>
                    <CardTitle>{meta.title}</CardTitle>
                </CardHeader>
            )}
            <CardContent className="p-4">
                <ChartWithFallback fallbackImage={props.fallbackImage}>
                    <ChoroplethMap
                        data={data ?? []}
                        colorConfig={{
                            colorSchemeType: "sequential" as const,
                            ...(props.colorScheme && { colorScheme: props.colorScheme }),
                        }}
                        unit={meta?.unit ?? props.unit}
                        isLoading={isLoading}
                        className={props.className}
                    />
                </ChartWithFallback>
            </CardContent>
        </Card>
    );
}
