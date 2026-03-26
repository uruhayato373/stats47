"use client";

import { useEffect, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import type { PageComponent } from "@/features/stat-charts/services/load-page-components";
import { fetchDbChartDataAction } from "../actions/fetch-db-chart-data";
import type { LineChartData, MixedChartData } from "@/features/stat-charts/types/visualization";

const D3LineChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3LineChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> },
);

const D3MixedChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.MixedChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> },
);

interface Props {
  chart: PageComponent;
  prefCode: string;
  prefName: string;
}

/**
 * DB 管理チャートのレンダラー
 *
 * chart_definitions の componentProps を直接使い、
 * stat-charts の fetchEstatData + adapter で描画する。
 * Single Source of Truth: chart_definitions テーブル。
 */
export function ThemeDbChartRenderer({ chart, prefCode, prefName }: Props) {
  const [chartResult, setChartResult] = useState<
    { type: "line"; data: LineChartData } | { type: "mixed"; data: MixedChartData } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setChartResult(null);
    startTransition(async () => {
      const result = await fetchDbChartDataAction(chart.componentType, chart.componentProps, prefCode);
      setChartResult(result);
    });
  }, [chart.componentKey, chart.componentType, prefCode]);

  if (isPending || !chartResult) {
    return <Skeleton className="h-[200px] w-full rounded-md" />;
  }

  if (chartResult.type === "line") {
    const { data } = chartResult;
    if (data.data.length <= 1) {
      return (
        <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
          時系列データがありません
        </div>
      );
    }
    return (
      <>
        <div className="h-[200px]">
          <D3LineChart
            data={data.data as Array<Record<string, string | number | undefined>>}
            categoryKey={data.xAxisKey}
            series={data.lines}
            showLegend
          />
        </div>
        {chart.sourceName && (
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            出典: {chart.sourceName}
          </p>
        )}
      </>
    );
  }

  if (chartResult.type === "mixed") {
    const { data } = chartResult;
    if (data.data.length <= 1) {
      return (
        <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
          時系列データがありません
        </div>
      );
    }
    return (
      <>
        <div className="h-[200px]">
          <D3MixedChart
            data={data.data as Array<Record<string, string | number | undefined>>}
            categoryKey={data.xAxisKey}
            columns={data.columns}
            lines={data.lines}
            leftUnit={data.leftUnit ?? ""}
            rightUnit={data.rightUnit ?? ""}
          />
        </div>
        {chart.sourceName && (
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            出典: {chart.sourceName}
          </p>
        )}
      </>
    );
  }

  return null;
}
