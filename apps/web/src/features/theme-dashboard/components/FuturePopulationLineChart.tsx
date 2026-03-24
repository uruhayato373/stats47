"use client";

import { useEffect, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import {
  fetchFuturePopulationAction,
  type FuturePopulationResult,
} from "../actions/fetch-future-population";

const D3LineChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3LineChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[200px] w-full rounded-md" />,
  },
);

interface Props {
  prefCode: string;
  prefName: string;
}

/**
 * 人口推移チャート（population-dynamics テーマ用）
 *
 * total-population の全年度推移 + 2050年変化率を表示。
 */
export function FuturePopulationLineChart({ prefCode, prefName }: Props) {
  const [data, setData] = useState<FuturePopulationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setData(null);
    startTransition(async () => {
      const result = await fetchFuturePopulationAction(prefCode);
      setData(result);
    });
  }, [prefCode]);

  if (isPending || !data) {
    return <Skeleton className="h-[200px] w-full rounded-md" />;
  }

  if (data.trendData.length <= 1) {
    return (
      <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
        人口推移データがありません
      </div>
    );
  }

  const chartData = data.trendData.map((d) => ({
    category: d.yearCode,
    label: d.yearName,
    value: d.value,
  }));

  return (
    <>
      <div className="h-[200px]">
        <D3LineChart
          data={chartData}
          categoryKey="category"
          valueKey="value"
          tooltipFormatter={(v) => `${v.toLocaleString()} 人`}
        />
      </div>
      {data.changeRate2050 != null && (
        <p className="text-[10px] text-muted-foreground mt-1">
          2050年推計変化率: {data.changeRate2050 > 0 ? "+" : ""}
          {data.changeRate2050.toFixed(1)}%
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">
        {prefName}の総人口推移 / 出典: 社会・人口統計体系
      </p>
    </>
  );
}
