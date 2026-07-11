"use client";

import dynamic from "next/dynamic";

import { ChartPanel } from "@/components/charts/ChartPanel";

import { ChartLoading } from "./ChartState";

import type { ScatterplotDataNode } from "@stats47/visualization/d3";

const Scatterplot = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.Scatterplot),
  {
    ssr: false,
    loading: () => <ChartLoading height={280} />,
  },
);

export interface ScatterChartGridItem {
  id: string;
  title: string;
  points: ScatterplotDataNode[];
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  diagonalLine?: boolean;
  diagonalLineNote?: string;
}

interface ScatterChartGridProps {
  items: ScatterChartGridItem[];
  chartHeight?: number;
  panelClassName?: string;
  gridClassName?: string;
  noteParentheses?: "ascii" | "ja";
}

export function ScatterChartGrid({
  items,
  chartHeight = 280,
  panelClassName,
  gridClassName = "grid grid-cols-1 gap-4 lg:grid-cols-2",
  noteParentheses = "ja",
}: ScatterChartGridProps) {
  return (
    <div className={gridClassName}>
      {items.map((item) => (
        <ScatterChartPanel
          key={item.id}
          item={item}
          height={chartHeight}
          panelClassName={panelClassName}
          noteParentheses={noteParentheses}
        />
      ))}
    </div>
  );
}

function ScatterChartPanel({
  item,
  height,
  panelClassName,
  noteParentheses,
}: {
  item: ScatterChartGridItem;
  height: number;
  panelClassName?: string;
  noteParentheses: "ascii" | "ja";
}) {
  return (
    <ChartPanel title={item.title} className={panelClassName}>
      <ScatterChartBody item={item} height={height} noteParentheses={noteParentheses} />
    </ChartPanel>
  );
}

function ScatterChartBody({
  item,
  height,
  noteParentheses,
}: {
  item: ScatterChartGridItem;
  height: number;
  noteParentheses: "ascii" | "ja";
}) {
  return (
    <>
      <Scatterplot
        data={item.points}
        xLabel={item.xLabel}
        yLabel={item.yLabel}
        height={height}
        r={4}
        fill="hsl(215, 70%, 60%)"
        stroke="hsl(215, 70%, 40%)"
        strokeWidth={1}
        strokeOpacity={0.8}
        regressionLine={
          item.diagonalLine ? { slope: 1, intercept: 0 } : undefined
        }
      />
      <p className="mt-1 text-[10px] text-muted-foreground">
        {formatAxisNote(item, noteParentheses)}
        {item.diagonalLineNote && ` / ${item.diagonalLineNote}`}
      </p>
    </>
  );
}

function formatAxisNote(
  item: ScatterChartGridItem,
  noteParentheses: "ascii" | "ja",
) {
  const xUnit = item.xUnit ?? "";
  const yUnit = item.yUnit ?? "";
  if (noteParentheses === "ascii") {
    return `X: ${item.xLabel} (${xUnit}) / Y: ${item.yLabel} (${yUnit})`;
  }
  return `X: ${item.xLabel}（${xUnit}）/ Y: ${item.yLabel}（${yUnit}）`;
}
