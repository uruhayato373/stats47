"use client";

import React from "react";

import dynamic from "next/dynamic";

import { ChartLoadingCard } from "@/components/charts/ChartState";

const D3RadarChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3RadarChart),
  { ssr: false, loading: () => <ChartLoadingCard /> }
);
import type { RadarChartData } from "../../../adapters/toRadarChartData";

interface RadarChartDashboardClientProps {
  chartData: RadarChartData;
}

export const RadarChartDashboardClient: React.FC<RadarChartDashboardClientProps> = ({
  chartData,
}) => {
  return (
    <D3RadarChart
      axes={chartData.axes}
      data={chartData.data}
      height={350}
      width={400}
      showLegend={chartData.data.length > 1}
    />
  );
};
