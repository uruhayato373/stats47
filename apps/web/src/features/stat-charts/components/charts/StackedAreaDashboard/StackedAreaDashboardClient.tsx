"use client";

import React from "react";
import dynamic from "next/dynamic";

import type { StackedAreaDataNode } from "@stats47/visualization/d3";

import { ChartSkeleton } from "../../shared/ChartSkeleton";

const D3StackedAreaChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3StackedAreaChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

import type { StackedAreaData } from "../../../adapters/toStackedAreaData";

interface StackedAreaDashboardClientProps {
  chartData: StackedAreaData;
  normalize?: boolean;
  yDomain?: [number, number];
}

export const StackedAreaDashboardClient: React.FC<StackedAreaDashboardClientProps> = ({
  chartData,
  normalize = false,
  yDomain,
}) => {
  const { categoryKey, data, series, unit } = chartData;

  return (
    <D3StackedAreaChart
      data={data as StackedAreaDataNode[]}
      categoryKey={categoryKey}
      series={series}
      normalize={normalize}
      unit={unit}
      height={280}
      showLegend
      yDomain={yDomain}
    />
  );
};
