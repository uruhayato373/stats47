"use client";

import React from "react";
import dynamic from "next/dynamic";

import type { TimeSeriesDataNode } from "@stats47/visualization/d3";

import { ChartSkeleton } from "../../shared/ChartSkeleton";

const MixedChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.MixedChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

import type { MixedChartData } from "../../../types/visualization";

interface MixedChartClientProps {
  chartData: MixedChartData;
}

export const MixedChartClient: React.FC<MixedChartClientProps> = ({
  chartData,
}) => {
  const { xAxisKey, data, columns, lines, leftUnit, rightUnit } = chartData;

  return (
    <MixedChart
      data={data as TimeSeriesDataNode[]}
      categoryKey={xAxisKey}
      columns={columns}
      lines={lines}
      leftUnit={leftUnit}
      rightUnit={rightUnit}
      height={280}
    />
  );
};
