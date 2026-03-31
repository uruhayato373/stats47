"use client";

import { useEffect, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import type { PageComponent, LineChartData, MixedChartData } from "@/features/stat-charts";
import { CompositionChartClient } from "@/features/stat-charts/components/charts/CompositionChart/CompositionChartClient";
import { LineChartClient } from "@/features/stat-charts/components/charts/LineChart/LineChartClient";
import { PyramidChartClient } from "@/features/stat-charts/components/charts/PyramidChart/PyramidChartClient";

import { fetchDbChartDataAction, type DonutChartItem, type CpiProfileItem, type CpiHeatmapItem, fetchPopulationPyramidAction, type PopulationPyramidResult } from "../actions";

const D3MixedChart = dynamic(
  () => import("@stats47/visualization/d3/MixedChart").then((mod) => mod.MixedChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> },
);

const DonutChart = dynamic(
  () => import("@stats47/visualization/d3/DonutChart").then((mod) => mod.DonutChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> },
);

const HorizontalDivergingBarChart = dynamic(
  () => import("@stats47/visualization/d3/HorizontalDivergingBarChart").then((mod) => mod.HorizontalDivergingBarChart),
  { ssr: false, loading: () => <Skeleton className="h-[250px] w-full rounded-md" /> },
);

const CategoryHeatmap = dynamic(
  () => import("@stats47/visualization/d3/CategoryHeatmap").then((mod) => mod.CategoryHeatmap),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-md" /> },
);



interface Props {
  chart: PageComponent;
  prefCode: string;
  prefName: string;
}

type ChartResult =
  | { type: "line"; data: LineChartData }
  | { type: "mixed"; data: MixedChartData }
  | { type: "composition"; data: import("@/features/stat-charts/adapters/toCompositionChartData").CompositionChartData }
  | { type: "donut"; data: DonutChartItem[] }
  | { type: "cpi-profile"; data: CpiProfileItem[] }
  | { type: "cpi-heatmap"; data: CpiHeatmapItem[] }
  | { type: "pyramid"; data: PopulationPyramidResult }
  | null;

/**
 * DB 管理チャートの統一レンダラー
 *
 * page_components の componentType に応じて適切な Server Action を呼び出し描画する。
 * Single Source of Truth: page_components テーブル。
 */
export function ThemeDbChartRenderer({ chart, prefCode, prefName }: Props) {
  const [chartResult, setChartResult] = useState<ChartResult>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setChartResult(null);
    startTransition(async () => {
      const { componentType } = chart;

      if (componentType === "line-chart" || componentType === "mixed-chart" || componentType === "composition-chart" || componentType === "donut-chart" || componentType === "cpi-profile" || componentType === "cpi-heatmap") {
        const result = await fetchDbChartDataAction(componentType, chart.componentProps, prefCode);
        setChartResult(result);
      } else if (componentType === "pyramid-chart") {
        const result = await fetchPopulationPyramidAction(prefCode);
        if (result) setChartResult({ type: "pyramid", data: result });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chart object reference changes on every render; only key/type determine fetch
  }, [chart.componentKey, chart.componentType, prefCode]);

  if (isPending || !chartResult) {
    return <Skeleton className="h-[200px] w-full rounded-md" />;
  }

  const source = chart.sourceName ? (
    <p className="text-[10px] text-muted-foreground mt-1 text-right">
      出典: {chart.sourceName}
    </p>
  ) : null;

  if (chartResult.type === "line") {
    const { data } = chartResult;
    if (data.data.length <= 1) {
      return <NoData />;
    }
    const showLatestValues = (chart.componentProps as Record<string, unknown>)?.showLatestValues === true;
    return (
      <>
        <LineChartClient chartData={data} showLatestValues={showLatestValues} />
        {source}
      </>
    );
  }

  if (chartResult.type === "mixed") {
    const { data } = chartResult;
    if (data.data.length <= 1) {
      return <NoData />;
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
        {source}
      </>
    );
  }

  if (chartResult.type === "donut") {
    const { data } = chartResult;
    if (data.length === 0) {
      return <NoData message="構成データがありません" />;
    }
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const topItem = data[0];
    const topPct = total > 0 ? ((topItem.value / total) * 100).toFixed(1) : "0";
    return (
      <>
        <div className="h-[200px]">
          <DonutChart data={data.map((d) => ({ ...d }))} centerText={`${topPct}%`} />
        </div>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
          {data.slice(0, 5).map((d) => (
            <div key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name} {total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%
            </div>
          ))}
        </div>
        {source}
      </>
    );
  }

  if (chartResult.type === "cpi-profile") {
    const { data } = chartResult;
    if (data.length === 0) return <NoData message="物価プロファイルデータがありません" />;
    return (
      <>
        <HorizontalDivergingBarChart
          data={data.map((d) => ({ label: d.label, value: d.value }))}
          baseline={100}
          height={Math.max(250, data.length * 30 + 40)}
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          全国平均=100 / 出典: 小売物価統計調査（構造編）
        </p>
      </>
    );
  }

  if (chartResult.type === "cpi-heatmap") {
    const { data } = chartResult;
    if (data.length === 0) return <NoData message="ヒートマップデータがありません" />;
    return (
      <>
        <CategoryHeatmap data={data} baseline={100} height={300} />
        <p className="text-[10px] text-muted-foreground mt-1">
          青=全国平均より高い / オレンジ=低い（全国平均=100）
        </p>
      </>
    );
  }

  if (chartResult.type === "pyramid") {
    const { data } = chartResult;
    if (data.pyramidData.length === 0) {
      return <NoData message="人口ピラミッドデータがありません" />;
    }
    return (
      <>
        <PyramidChartClient chartData={data.pyramidData} year={data.yearName} />
        {source}
      </>
    );
  }

  if (chartResult.type === "composition") {
    const { data } = chartResult;
    const defaultTab = (chart.componentProps as Record<string, unknown>)?.defaultTab as "composition" | "trend" | undefined;
    return (
      <>
        <CompositionChartClient chartData={data} defaultTab={defaultTab} />
        {source}
      </>
    );
  }

  return null;
}

function NoData({ message = "時系列データがありません" }: { message?: string }) {
  return (
    <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
