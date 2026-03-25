"use client";

import { useEffect, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import type { ChartDefinition } from "@stats47/types";

import { fetchThemeChartDataAction } from "../actions/fetch-chart-data";
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
  chartDef: ChartDefinition;
  prefCode: string;
  prefName: string;
}

/**
 * テーマダッシュボード用チャートパネル
 *
 * stat-charts と同じデータパイプライン（fetchEstatData + toLineChartData/toMixedChartData）
 * を Server Action 経由で呼び出し、D3 コンポーネントで描画する。
 */
export function ThemeChartPanel({ chartDef, prefCode, prefName }: Props) {
  const [chartResult, setChartResult] = useState<
    { type: "line"; data: LineChartData } | { type: "mixed"; data: MixedChartData } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setChartResult(null);
    if (chartDef.type === "donut-action") return; // donut は別コンポーネントで処理

    startTransition(async () => {
      const result = await fetchThemeChartDataAction(chartDef, prefCode);
      setChartResult(result);
    });
  }, [chartDef, prefCode]);

  if (chartDef.type === "donut-action") return null;

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
        {chartDef.type === "dual-line" && chartDef.source && (
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            出典: {chartDef.source}
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
        {chartDef.type === "mixed" && chartDef.source && (
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            出典: {chartDef.source}
          </p>
        )}
      </>
    );
  }

  return null;
}
