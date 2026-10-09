"use client";

import React from "react";

import dynamic from "next/dynamic";

import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { formatValueWithPrecision, resolveValuePrecision } from "@stats47/utils";

import { ChartSkeleton } from "../../shared/ChartSkeleton";

import type { LineChartData } from "../../../types/visualization";
import type { TimeSeriesDataNode } from "@stats47/visualization/d3";

const D3LineChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3LineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface LineChartClientProps {
  chartData: LineChartData;
  xTickValues?: string[];
  yDomain?: [number, number];
  rightYDomain?: [number, number];
  showLatestValues?: boolean;
}

export const LineChartClient: React.FC<LineChartClientProps> = ({
  chartData,
  xTickValues,
  yDomain,
  rightYDomain,
  showLatestValues,
}) => {
  const { xAxisKey, data, lines, unit, rightUnit } = chartData;
  const categoryKey = xAxisKey;
  const showLegend = lines.length > 1;
  const valueKey = lines.length === 1 ? lines[0]?.dataKey : undefined;
  const onlyRight = lines.length > 0 && lines.every(line => line.yAxis === 'right');
  const series = onlyRight ? lines.map(line => ({...line, yAxis: 'left' as const})) : lines;
  const primaryUnit = onlyRight ? rightUnit : unit;
  const primaryDomain = onlyRight ? rightYDomain : yDomain;

  const hasRightSeries = series.some((line) => line.yAxis === "right");

  const precisionByAxis = Object.fromEntries(
    (["left", "right"] as const).map(axis => [axis, resolveValuePrecision(
      data.flatMap(row => lines.filter(line => (line.yAxis ?? "left") === axis)
        .map(line => typeof row[line.dataKey] === "number" ? row[line.dataKey] as number : NaN))
    )])
  ) as Record<"left" | "right", number>;

  const latest = data.length > 0 ? data[data.length - 1] : null;
  const latestLabel = latest ? (latest.label as string) ?? String(latest[categoryKey]) : "";

  return (
    <div>
      <D3LineChart
        data={data as TimeSeriesDataNode[]}
        categoryKey={categoryKey}
        xTickValues={xTickValues}
        valueKey={valueKey}
        series={series}
        showLegend={showLegend}
        height={250}
        colors={lines.length === 1 ? lines[0]?.color ? [lines[0].color] : undefined : undefined}
        yDomain={primaryDomain}
        rightYDomain={rightYDomain}
        unit={primaryUnit}
        rightUnit={hasRightSeries ? rightUnit : undefined}
      />
      {showLatestValues && latest && lines.length > 1 && (
        <div className="mt-3 pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1.5">{latestLabel}</div>
          <ul className="divide-y divide-border">
            {lines.map((line) => {
              const value = latest[line.dataKey];
              const lineUnit = line.yAxis === "right" ? rightUnit : unit;
              return (
                <li key={line.dataKey} className="flex items-center gap-2 py-1 text-xs">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: line.color }}
                  />
                  <span className="text-foreground/80">{line.name}</span>
                  <span className="ml-auto tabular-nums font-medium">
                    {typeof value === "number" && Number.isFinite(value) ? formatValueWithPrecision(value, precisionByAxis[line.yAxis ?? "left"]) : "—"}
                    {lineUnit ? <span className="font-normal text-muted-foreground ml-0.5">{formatUnitForDisplay(lineUnit)}</span> : null}
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
