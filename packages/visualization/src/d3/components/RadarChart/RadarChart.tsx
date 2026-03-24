"use client";

import { cn } from "@stats47/components";
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { computeFontSize } from "../../../shared/layout";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { D3RadarChartProps } from "./types";

const DEFAULT_COLORS = d3.schemeTableau10 as readonly string[];

function defaultFormat(value: number): string {
  return value.toLocaleString();
}

/**
 * D3 RadarChart - レーダーチャート（5-8 軸対応）
 *
 * 極座標系でデータを表示。財政健全度スコアカード等に使用。
 */
export function RadarChart({
  axes,
  data,
  gridLevels = 5,
  fillOpacity = 0.15,
  showLegend = true,
  width = 500,
  height = 500,
  title,
  colors = DEFAULT_COLORS,
  isLoading = false,
  className,
  tooltipFormatter = defaultFormat,
}: D3RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  const baseFontSize = computeFontSize(width, height, 0.022);

  useEffect(() => {
    if (!svgRef.current || !axes.length || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = Math.max(60, width * 0.12);
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - margin;

    const numAxes = axes.length;
    const angleSlice = (2 * Math.PI) / numAxes;

    // Calculate max for each axis
    const axisMaxes = axes.map((axis) => {
      if (axis.max != null) return axis.max;
      const vals = data.map((d) => d.values[axis.key] ?? 0);
      return Math.max(...vals, 1);
    });

    // Grid lines
    const gridG = svg.append("g").attr("class", "grid");
    for (let level = 1; level <= gridLevels; level++) {
      const r = (radius / gridLevels) * level;
      const points = axes
        .map((_, i) => {
          const angle = angleSlice * i - Math.PI / 2;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        })
        .join(" ");
      gridG
        .append("polygon")
        .attr("points", points)
        .attr("fill", "none")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.15)
        .attr("stroke-width", 0.5);

      // Grid level label
      if (level === gridLevels) {
        gridG
          .append("text")
          .attr("x", cx + 4)
          .attr("y", cy - r - 2)
          .attr("font-size", baseFontSize * 0.8)
          .attr("fill", "currentColor")
          .attr("opacity", 0.4)
          .text("max");
      }
    }

    // Axis lines and labels
    const axisG = svg.append("g").attr("class", "axes");
    axes.forEach((axis, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x2 = cx + radius * Math.cos(angle);
      const y2 = cy + radius * Math.sin(angle);

      axisG
        .append("line")
        .attr("x1", cx)
        .attr("y1", cy)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.2)
        .attr("stroke-width", 0.5);

      // Label
      const labelRadius = radius + 14;
      const lx = cx + labelRadius * Math.cos(angle);
      const ly = cy + labelRadius * Math.sin(angle);

      let textAnchor: string;
      if (Math.abs(Math.cos(angle)) < 0.1) {
        textAnchor = "middle";
      } else if (Math.cos(angle) > 0) {
        textAnchor = "start";
      } else {
        textAnchor = "end";
      }

      axisG
        .append("text")
        .attr("x", lx)
        .attr("y", ly)
        .attr("text-anchor", textAnchor)
        .attr("dominant-baseline", "central")
        .attr("font-size", baseFontSize)
        .attr("fill", "currentColor")
        .text(axis.label);
    });

    // Data series
    const seriesG = svg.append("g").attr("class", "series");
    data.forEach((series, si) => {
      const seriesColor = series.color ?? (colors[si % colors.length] as string);

      const points = axes.map((axis, i) => {
        const val = series.values[axis.key] ?? 0;
        const r = (val / axisMaxes[i]) * radius;
        const angle = angleSlice * i - Math.PI / 2;
        return {
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
        };
      });

      const pointsStr = points.map((p) => `${p.x},${p.y}`).join(" ");

      // Fill area
      seriesG
        .append("polygon")
        .attr("points", pointsStr)
        .attr("fill", seriesColor)
        .attr("fill-opacity", fillOpacity)
        .attr("stroke", seriesColor)
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round");

      // Data points
      points.forEach((p, i) => {
        const axis = axes[i];
        const val = series.values[axis.key] ?? 0;

        seriesG
          .append("circle")
          .attr("cx", p.x)
          .attr("cy", p.y)
          .attr("r", 4)
          .attr("fill", seriesColor)
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .style("cursor", "pointer")
          .on("mouseenter", (event) => {
            showTooltip(event, `${axis.label}`, {
              value: val,
              categoryName: series.label,
              unit: "",
            });
          })
          .on("mousemove", (event) => updateTooltipPosition(event))
          .on("mouseleave", () => hideTooltip());
      });
    });

    // Legend
    if (showLegend && data.length > 1) {
      const legendG = svg
        .append("g")
        .attr("transform", `translate(${margin / 2},${height - margin / 2 + 10})`);

      let xOffset = 0;
      data.forEach((series, si) => {
        const seriesColor = series.color ?? (colors[si % colors.length] as string);
        const g = legendG.append("g").attr("transform", `translate(${xOffset},0)`);
        g.append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("rx", 2)
          .attr("fill", seriesColor)
          .attr("fill-opacity", 0.7);
        const textEl = g
          .append("text")
          .attr("x", 16)
          .attr("y", 10)
          .attr("font-size", baseFontSize)
          .attr("fill", "currentColor")
          .text(series.label);
        const textWidth = textEl.node()?.getComputedTextLength() ?? 60;
        xOffset += 16 + textWidth + 16;
      });
    }
  }, [
    axes,
    data,
    gridLevels,
    fillOpacity,
    showLegend,
    width,
    height,
    baseFontSize,
    colors,
    tooltipFormatter,
    showTooltip,
    hideTooltip,
    updateTooltipPosition,
  ]);

  return (
    <div
      className={cn(
        "relative flex flex-col w-full",
        className
      )}
    >
      {title && (
        <h3 className="mb-2 self-start text-lg font-semibold">{title}</h3>
      )}
      <div className="relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
