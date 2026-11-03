"use client";

import { CHART_COLORS } from "@/components/charts/ChartPalette";
import { BarChartClient } from "@/components/stat-charts/components/charts/BarChart/BarChartClient";

import type { KakeiAxisChart as KakeiAxisChartData } from "@stats47/stats-r2/types";

/** 家計調査の分類軸 (年間収入・世帯人数など) ごとの値を共通の横棒で描く。見出しは呼び出し側の ChartPanel が持つ */
export function KakeiAxisChart({ chart }: { chart: KakeiAxisChartData }) {
  return <BarChartClient
    chartType="bar"
    chartData={{
      categoryKey: "name",
      data: chart.rows.map(row => ({ name: row.label, value: row.value, code: row.code })),
      series: [{ dataKey: "value", name: chart.title, color: CHART_COLORS[0] }],
      unit: chart.unit,
    }}
    height={chart.rows.length > 10 ? 720 : 400}
    xDomain={[0, Math.max(...chart.rows.map(row => row.value)) * 1.1]}
  />;
}
