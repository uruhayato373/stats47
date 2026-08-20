"use client";

import dynamic from "next/dynamic";

import type { LineChartData } from "@/components/stat-charts/types/visualization";

const LineChartClient = dynamic(
  () =>
    import("@/components/stat-charts/components/charts/LineChart/LineChartClient").then(
      (mod) => mod.LineChartClient,
    ),
  { ssr: false },
);

interface Props {
  title: string;
  unit: string;
  points: { yearName: string; value: number }[];
}

/**
 * 日本全国値の時系列 line chart (GEO-SCOPE-SEPARATION-01 WP4)。
 * 描く系列は常に 1 本 (公式全国値のみ)。比較線・平均線は持たない
 * (`/japan` は日本を主語にする面であり、都道府県平均との比較は `/themes` の役割)。
 */
export function JapanMetricChart({ title, unit, points }: Props) {
  if (points.length === 0) return null;

  const chartData: LineChartData = {
    xAxisKey: "year",
    data: points.map((p) => ({ year: p.yearName, value: p.value })),
    lines: [{ dataKey: "value", name: title, color: "hsl(var(--primary))" }],
    unit,
  };

  return <LineChartClient chartData={chartData} />;
}
