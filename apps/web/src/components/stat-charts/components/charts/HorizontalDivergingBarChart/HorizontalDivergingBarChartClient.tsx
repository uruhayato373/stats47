"use client";

import React from "react";

import dynamic from "next/dynamic";

import { ChartLoading } from "@/components/charts/ChartState";

import type { HorizontalDivergingBarChartProps } from "@stats47/visualization/d3";

const HorizontalDivergingBarChart = dynamic(
  () =>
    import("@stats47/visualization/d3/HorizontalDivergingBarChart").then(
      (mod) => mod.HorizontalDivergingBarChart
    ),
  { ssr: false, loading: () => <ChartLoading height={250} /> }
);

export type HorizontalDivergingBarChartClientProps = HorizontalDivergingBarChartProps;

/**
 * 基準値 (例: 全国平均=100) からの上下を横棒で描く薄い包み。
 * 描画とツールチップ (useD3Tooltip) は D3 の部品が持ち、ここは読み込みと状態表示だけを担う。
 */
export const HorizontalDivergingBarChartClient: React.FC<HorizontalDivergingBarChartClientProps> = (props) => (
  <HorizontalDivergingBarChart {...props} />
);
