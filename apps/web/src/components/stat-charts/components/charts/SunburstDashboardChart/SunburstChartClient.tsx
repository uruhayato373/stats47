"use client";

import React from "react";

import dynamic from "next/dynamic";

import { ChartSkeleton } from "../../shared/ChartSkeleton";

import type { HierarchyDataNode } from "@stats47/visualization/d3";


const SunburstChart = dynamic(
  () => import("@stats47/visualization/d3/SunburstChart").then((mod) => mod.SunburstChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface SunburstChartClientProps {
  data: HierarchyDataNode;
  unit?: string;
}

export const SunburstChartClient: React.FC<SunburstChartClientProps> = ({
  data,
  unit,
}) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <SunburstChart data={data} width={500} height={500} unit={unit} />
  </div>
);
