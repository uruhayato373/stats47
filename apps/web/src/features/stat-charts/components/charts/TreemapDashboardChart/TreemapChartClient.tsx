"use client";

import React from "react";
import dynamic from "next/dynamic";

import type { HierarchyDataNode } from "@stats47/visualization/d3";

import { ChartSkeleton } from "../../shared/ChartSkeleton";

const TreemapChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.TreemapChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface TreemapChartClientProps {
  data: HierarchyDataNode;
}

export const TreemapChartClient: React.FC<TreemapChartClientProps> = ({
  data,
}) => (
  <div className="w-full">
    <TreemapChart data={data} width={700} height={420} />
  </div>
);
