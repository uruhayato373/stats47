"use client";

import { cn } from "@stats47/components";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { computeChartLayout, computeFontSize, computeMarginsByRatio } from "../../../shared/layout";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { ColumnChartProps } from "./types";

/**
 * ColumnChart - 垂直方向の積み上げ棒グラフ
 */
export function ColumnChart({
  data,
  indexBy,
  keys,
  width = 800,
  height = 500,
  marginTop: propsMarginTop,
  marginRight: propsMarginRight,
  marginBottom: propsMarginBottom,
  marginLeft: propsMarginLeft,
  yAxisFormatter = (d) => (d / 1e6).toFixed(0) + "M",
  colors = d3.schemeTableau10,
  isLoading = false,
  tooltipFormatter,
  unit = "",
}: ColumnChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  // --- レイアウト計算 ---
  const marginsByRatio = computeMarginsByRatio(width, height, {
    top: 10 / 500,     // 0.02
    right: 10 / 800,   // 0.0125
    bottom: 50 / 500,  // 0.04
    left: 40 / 800,    // 0.05
  });

  const layout = computeChartLayout(width, height, {
    marginTop: propsMarginTop ?? marginsByRatio.marginTop,
    marginRight: propsMarginRight ?? marginsByRatio.marginRight,
    marginBottom: propsMarginBottom ?? marginsByRatio.marginBottom,
    marginLeft: propsMarginLeft ?? marginsByRatio.marginLeft,
  });

  const { innerWidth, innerHeight, marginTop, marginLeft, marginRight, marginBottom } = layout;
  const baseFontSize = computeFontSize(width, height, 0.025); // 16 / 800 = 0.02

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // --- スタック計算 ---
    const series = d3.stack<any>()
      .keys(keys)(data);

    // --- スケール設定 ---
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d[indexBy] as string))
      .range([marginLeft, width - marginRight])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(series, (d) => d3.max(d, (d) => d[1])) ?? 0])
      .rangeRound([height - marginBottom, marginTop]);

    const color = d3.scaleOrdinal<string>().domain(keys).range(colors);

    // --- 描画 ---
    // Bars
    svg
      .append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d: any) => x(d.data[indexBy])!)
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .style("cursor", "pointer")
      .on("mouseenter", (event, d: any) => {
        showTooltip(event, String(d.data[indexBy]), {
          value: d[1] - d[0],
          unit,
          categoryName: d.key ?? keys[0],
        });
      })
      .on("mousemove", (event) => updateTooltipPosition(event))
      .on("mouseleave", () => hideTooltip());

    // X Axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("dy", "8"));

    // Y Axis
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(innerHeight / 40, "s"))
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke-opacity", 0).clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1)
      )
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("dx", "-4"));

  }, [data, indexBy, keys, width, height, yAxisFormatter, colors, marginTop, marginBottom, marginLeft, marginRight, baseFontSize, innerHeight, unit, showTooltip, hideTooltip, updateTooltipPosition]);

  return (
    <div
      className={cn(
        "relative w-full"
      )}
    >
      <div className="relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
