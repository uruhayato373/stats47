"use client";

import React from "react";

import dynamic from "next/dynamic";

import { ChartSkeleton } from "../../shared/ChartSkeleton";

import type { LineChartData } from "../../../types/visualization";
import type { TimeSeriesDataNode } from "@stats47/visualization/d3";

const D3LineChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3LineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface LineChartClientProps {
  chartData: LineChartData;
  yDomain?: [number, number];
  showLatestValues?: boolean;
}

export const LineChartClient: React.FC<LineChartClientProps> = ({
  chartData,
  yDomain,
  showLatestValues,
}) => {
  const { xAxisKey, data, lines, unit } = chartData;
  const categoryKey = xAxisKey;
  const showLegend = lines.length > 1;
  const valueKey = lines.length === 1 ? lines[0]?.dataKey : undefined;
  const series = lines.length > 1 ? lines : undefined;

  const latest = data.length > 0 ? data[data.length - 1] : null;
  const latestLabel = latest ? (latest.label as string) ?? String(latest[categoryKey]) : "";

  return (
    <div>
      <D3LineChart
        data={data as TimeSeriesDataNode[]}
        categoryKey={categoryKey}
        valueKey={valueKey}
        series={series}
        showLegend={showLegend}
        height={250}
        colors={lines.length === 1 ? lines[0]?.color ? [lines[0].color] : undefined : undefined}
        yDomain={yDomain}
      />
      {showLatestValues && latest && lines.length > 1 && (
        <div className="mt-3 pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1.5">{latestLabel}</div>
          <ul className="divide-y divide-border">
            {lines.map((line) => {
              const value = Number(latest[line.dataKey]) || 0;
              return (
                <li key={line.dataKey} className="flex items-center gap-2 py-1 text-xs">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: line.color }}
                  />
                  <span className="text-foreground/80">{line.name}</span>
                  <span className="ml-auto tabular-nums font-medium">
                    {value.toLocaleString()}
                    {unit ? <span className="font-normal text-muted-foreground ml-0.5">{unit}</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
