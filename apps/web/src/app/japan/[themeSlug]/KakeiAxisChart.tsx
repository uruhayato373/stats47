"use client";

import dynamic from "next/dynamic";

import type { KakeiAxisChart as KakeiAxisChartData } from "@stats47/stats-r2/types";

const BarChart = dynamic(() => import("@stats47/visualization/d3/BarChart").then(mod => mod.BarChart), { ssr: false });

export function KakeiAxisChart({ chart }: { chart: KakeiAxisChartData }) {
  return <BarChart
    title={chart.title}
    data={chart.rows.map(row => ({ name: row.label, value: row.value, code: row.code }))}
    unit={chart.unit}
    width={800}
    height={chart.rows.length > 10 ? 720 : 400}
    xDomain={[0, Math.max(...chart.rows.map(row => row.value)) * 1.1]}
    valueFormat={value => `${value.toLocaleString("ja-JP")}${chart.unit}`}
  />;
}
