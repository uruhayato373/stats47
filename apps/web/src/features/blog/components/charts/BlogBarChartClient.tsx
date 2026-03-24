"use client";

import dynamic from "next/dynamic";
import type { ChartDataNode, BarChartProps } from "@stats47/visualization";

const BarChart = dynamic<BarChartProps>(
  () => import("@stats47/visualization").then((mod) => mod.BarChart),
  { ssr: false }
);

interface BlogBarChartClientProps {
  data: ChartDataNode[];
  unit?: string;
  title?: string;
  className?: string;
}

export function BlogBarChartClient({
  data,
  unit,
  title,
  className,
}: BlogBarChartClientProps) {
  return (
    <BarChart
      data={data}
      unit={unit}
      title={title}
      className={className}
    />
  );
}
