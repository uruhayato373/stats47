"use client";

import React from "react";

import dynamic from "next/dynamic";

import { ChartSkeleton } from "../../shared/ChartSkeleton";

import type { PyramidChartData } from "@stats47/visualization/d3";


const PyramidChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.PyramidChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface PyramidChartClientProps {
  chartData: PyramidChartData[];
  year?: string;
}

export const PyramidChartClient: React.FC<PyramidChartClientProps> = ({
  chartData,
  year,
}) => {
  return (
    <div>
      {year && (
        <div className="flex items-center justify-center mb-2">
          <span className="text-sm text-muted-foreground">{year}</span>
        </div>
      )}
      <PyramidChart chartData={chartData} height={400} />
    </div>
  );
};
