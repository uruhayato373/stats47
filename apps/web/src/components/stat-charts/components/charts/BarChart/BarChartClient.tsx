"use client";

import React from "react";

import dynamic from "next/dynamic";

import {
  compactAxisFormat,
  type ChartDataNode,
} from "@stats47/visualization/d3";

import { CHART_COLORS } from "../../../constants";
import { ChartSkeleton } from "../../shared/ChartSkeleton";

import type { BarChartData } from "../../../types/visualization";

const BarChart = dynamic(
  () => import("@stats47/visualization/d3/BarChart").then((mod) => mod.BarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface BarChartClientProps {
  chartData: BarChartData;
  chartType?: "bar" | "stacked-bar" | "grouped";
  xDomain?: [number, number];
}

export const BarChartClient: React.FC<BarChartClientProps> = ({
  chartData,
  chartType = "stacked-bar",
  xDomain,
}) => {
  const { categoryKey, data, series, unit } = chartData;
  const indexBy = categoryKey;
  const isMultiSeries = chartType === "stacked-bar" || chartType === "grouped";

  if (isMultiSeries) {
    const keys = series.map((s) => s.dataKey);
    const colors = series.map((s) => s.color);
    return (
      <BarChart
        data={data as ChartDataNode[]}
        keys={keys}
        indexBy={indexBy}
        height={300}
        showLegend
        colors={colors}
        valueFormat={compactAxisFormat}
        unit={unit}
        xDomain={xDomain}
        mode={chartType === "grouped" ? "grouped" : "stacked"}
      />
    );
  }

  const valueKey = series[0]?.dataKey ?? "value";
  return (
    <BarChart
      data={data as ChartDataNode[]}
      valueKey={valueKey}
      indexBy={indexBy}
      height={300}
      colors={
        series[0]?.color ? [series[0].color] : CHART_COLORS
      }
      valueFormat={compactAxisFormat}
      unit={unit}
      xDomain={xDomain}
    />
  );
};
