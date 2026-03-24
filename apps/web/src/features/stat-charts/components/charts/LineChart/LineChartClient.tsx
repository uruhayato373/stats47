"use client";

import React from "react";
import dynamic from "next/dynamic";

import type { TimeSeriesDataNode } from "@stats47/visualization/d3";

import { ChartSkeleton } from "../../shared/ChartSkeleton";

const D3LineChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3LineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

import type { LineChartData } from "../../../types/visualization";

interface LineChartClientProps {
  chartData: LineChartData;
  yDomain?: [number, number];
}

export const LineChartClient: React.FC<LineChartClientProps> = ({
  chartData,
  yDomain,
}) => {
  const { xAxisKey, data, lines } = chartData;
  const categoryKey = xAxisKey;
  const showLegend = lines.length > 1;
  const valueKey = lines.length === 1 ? lines[0]?.dataKey : undefined;
  const series = lines.length > 1 ? lines : undefined;

  return (
    <D3LineChart
      data={data as TimeSeriesDataNode[]}
      categoryKey={categoryKey}
      valueKey={valueKey}
      series={series}
      showLegend={showLegend}
      height={250}
      colors={lines.length === 1 ? lines[0]?.color ? [lines[0].color] : undefined : undefined}
      yDomain={yDomain}
    />
  );
};
