"use client";

import dynamic from "next/dynamic";

import type { TimeSeriesDataNode, D3LineChartProps } from "@stats47/visualization/d3";

const LineChart = dynamic<D3LineChartProps>(
  () => import("@stats47/visualization/d3/LineChart").then((mod) => mod.D3LineChart),
  { ssr: false }
);

interface BlogLineChartClientProps {
  data: TimeSeriesDataNode[] | Record<string, string | number>[];
  unit?: string;
  title?: string;
  className?: string;
}

export function BlogLineChartClient({
  data,
  unit,
  title,
  className,
}: BlogLineChartClientProps) {
  return (
    <LineChart
      data={data}
      unit={unit}
      title={title}
      className={className}
    />
  );
}
