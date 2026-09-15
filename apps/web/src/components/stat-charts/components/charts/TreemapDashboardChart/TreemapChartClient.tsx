"use client";

import React from "react";

import dynamic from "next/dynamic";

import { ChartSkeleton } from "../../shared/ChartSkeleton";

import type { HierarchyDataNode } from "@stats47/visualization/d3";


const TreemapChart = dynamic(
  () => import("@stats47/visualization/d3/TreemapChart").then((mod) => mod.TreemapChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface TreemapChartClientProps {
  data: HierarchyDataNode;
  unit?: string;
}

export const TreemapChartClient: React.FC<TreemapChartClientProps> = ({
  data,
  unit,
}) => (
  <div className="w-full">
    <TreemapChart data={data} width={700} height={420} unit={unit} />
  </div>
);
