"use client";

import dynamic from "next/dynamic";
import type { MapDataPoint, PrefectureMapProps } from "@stats47/visualization";
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { type ChoroplethMapConfig } from "../../types/chart-config.types";
import { useChartData } from "../../hooks/useChartData";
import { ChartWithFallback } from "./ChartWithFallback";

const ChoroplethMap = dynamic<PrefectureMapProps>(
    () => import("@stats47/visualization").then((mod) => mod.PrefectureMapChart),
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
