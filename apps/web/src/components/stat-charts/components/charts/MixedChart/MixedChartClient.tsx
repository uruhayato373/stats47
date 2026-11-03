"use client";

import React from "react";

import dynamic from "next/dynamic";

import { ChartLoadingCard } from "@/components/charts/ChartState";

import type { MixedChartData } from "../../../types/visualization";
import type { TimeSeriesDataNode } from "@stats47/visualization/d3";

const MixedChart = dynamic(
  () => import("@stats47/visualization/d3/MixedChart").then((mod) => mod.MixedChart),
  { ssr: false, loading: () => <ChartLoadingCard /> }
);

interface MixedChartClientProps {
  chartData: MixedChartData;
  /** 左Y軸 (棒) の範囲。共通の軸の方針で決めた範囲を渡す */
  leftYDomain?: [number, number];
  /** 右Y軸 (折れ線) の範囲 */
  rightYDomain?: [number, number];
  /** SVG の高さ (既定 280) */
  height?: number;
}

export const MixedChartClient: React.FC<MixedChartClientProps> = ({
  chartData,
  leftYDomain,
  rightYDomain,
  height = 280,
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
      leftYDomain={leftYDomain}
      rightYDomain={rightYDomain}
      height={height}
    />
  );
};
