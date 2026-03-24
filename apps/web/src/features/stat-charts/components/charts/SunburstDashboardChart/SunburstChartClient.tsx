"use client";

import React from "react";
import dynamic from "next/dynamic";

import type { HierarchyDataNode } from "@stats47/visualization/d3";

import { ChartSkeleton } from "../../shared/ChartSkeleton";

const SunburstChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.SunburstChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface SunburstChartClientProps {
  data: HierarchyDataNode;
}

export const SunburstChartClient: React.FC<SunburstChartClientProps> = ({
  data,
}) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <SunburstChart data={data} width={500} height={500} />
  </div>
);
