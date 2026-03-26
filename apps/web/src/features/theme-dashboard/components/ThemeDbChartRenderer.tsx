"use client";

import { useEffect, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import type { PageComponent } from "@/features/stat-charts/services/load-page-components";
import { fetchDbChartDataAction } from "../actions/fetch-db-chart-data";
import { fetchPopulationPyramidAction, type PopulationPyramidResult } from "../actions/fetch-population-pyramid";
import { fetchPopulationCompositionAction, type AgeCompositionResult } from "../actions/fetch-population-composition";
import type { LineChartData, MixedChartData } from "@/features/stat-charts/types/visualization";

const D3LineChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3LineChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> },
);

const D3MixedChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.MixedChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> },
);

const PyramidChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.PyramidChart),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-md" /> },
);

// AgeCompositionChart は既存コンポーネントを dynamic import
const AgeCompositionChart = dynamic(
  () => import("./AgeCompositionChart").then((mod) => mod.AgeCompositionChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> },
);

interface Props {
  chart: PageComponent;
  prefCode: string;
  prefName: string;
}

type ChartResult =
  | { type: "line"; data: LineChartData }
  | { type: "mixed"; data: MixedChartData }
  | { type: "pyramid"; data: PopulationPyramidResult }
  | { type: "composition"; data: AgeCompositionResult }
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

      if (componentType === "line-chart" || componentType === "mixed-chart") {
        const result = await fetchDbChartDataAction(componentType, chart.componentProps, prefCode);
        setChartResult(result);
      } else if (componentType === "pyramid-chart") {
        const result = await fetchPopulationPyramidAction(prefCode);
        if (result) setChartResult({ type: "pyramid", data: result });
      } else if (componentType === "composition-chart") {
        const result = await fetchPopulationCompositionAction(prefCode);
        if (result) setChartResult({ type: "composition", data: result });
      }
    });
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

  if (chartResult.type === "pyramid") {
    const { data } = chartResult;
    if (data.pyramidData.length === 0) {
      return <NoData message="人口ピラミッドデータがありません" />;
    }
    return (
      <>
        <PyramidChart chartData={data.pyramidData} height={450} />
        {source}
      </>
    );
  }

  if (chartResult.type === "composition") {
    const { data } = chartResult;
    return (
      <>
        <AgeCompositionChart
          prefData={data.prefData}
          nationalData={data.nationalData}
          prefName={prefCode !== "00000" ? prefName : undefined}
          loading={false}
        />
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
