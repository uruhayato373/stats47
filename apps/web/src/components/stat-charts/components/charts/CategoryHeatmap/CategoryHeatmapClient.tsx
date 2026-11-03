"use client";

import React from "react";

import dynamic from "next/dynamic";

import { ChartLoading } from "@/components/charts/ChartState";

import type { CategoryHeatmapProps } from "@stats47/visualization/d3";

const CategoryHeatmap = dynamic(
  () =>
    import("@stats47/visualization/d3/CategoryHeatmap").then(
      (mod) => mod.CategoryHeatmap
    ),
  { ssr: false, loading: () => <ChartLoading height={280} /> }
);

export type CategoryHeatmapClientProps = CategoryHeatmapProps;

/**
 * 項目 × 年のヒートマップ (基準値で色を分ける) の薄い包み。
 * 描画とツールチップ (useD3Tooltip) は D3 の部品が持ち、ここは読み込みと状態表示だけを担う。
 */
export const CategoryHeatmapClient: React.FC<CategoryHeatmapClientProps> = (props) => (
  <CategoryHeatmap {...props} />
);
