"use client";

import { cn } from "@stats47/components";
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import {
  computeChartLayout,
  computeFontSize,
  computeMarginsByRatio,
} from "../../../shared/layout";
import { CHART_STYLES } from "../../constants";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { DivergingBarChartProps } from "./types";

/**
 * DivergingBarChart - 上下に分かれた縦棒グラフ
 *
 * 転入/転出のように対になるデータを、0を中心に上下に描画する。
 */
export function DivergingBarChart({
  data,
  categoryKey,
  positiveKey,
  negativeKey,
  positiveName,
  negativeName,
  positiveColor = "#3b82f6",
  negativeColor = "#ef4444",
  width = 800,
  height = 500,
  marginTop: propsMarginTop,
  marginRight: propsMarginRight,
  marginBottom: propsMarginBottom,
  marginLeft: propsMarginLeft,
  yAxisFormatter,
  yDomain,
  unit = "",
  isLoading = false,
  className,
}: DivergingBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  const marginsByRatio = computeMarginsByRatio(width, height, {
    top: 10 / 500,
    right: 10 / 800,
    bottom: 50 / 500,
    left: 50 / 800,
  });

  const layout = computeChartLayout(width, height, {
    marginTop: propsMarginTop ?? marginsByRatio.marginTop,
    marginRight: propsMarginRight ?? marginsByRatio.marginRight,
    marginBottom: propsMarginBottom ?? marginsByRatio.marginBottom,
    marginLeft: propsMarginLeft ?? marginsByRatio.marginLeft,
  });

  const {
    innerWidth,
    innerHeight,
    marginTop,
    marginLeft,
    marginRight,
    marginBottom,
  } = layout;
  const baseFontSize = computeFontSize(width, height, CHART_STYLES.font.sizeRatio);

  const defaultFormatter = (d: number) => {
    const abs = Math.abs(d);
    if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 10_000) return `${(abs / 10_000).toFixed(0)}万`;
    if (abs >= 1_000) return `${(abs / 1_000).toFixed(1)}千`;
    return abs.toLocaleString();
  };
  const formatY = yAxisFormatter ?? defaultFormatter;

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // X scale (band)
    const x = d3
      .scaleBand()
      .domain(data.map((d) => String(d[categoryKey])))
      .range([marginLeft, width - marginRight])
      .padding(0.15);

    // Calculate max value for symmetric Y domain
    const maxPositive = d3.max(data, (d) => Number(d[positiveKey]) || 0) ?? 0;
    const maxNegative = d3.max(data, (d) => Number(d[negativeKey]) || 0) ?? 0;
    const maxVal = yDomain
      ? yDomain[1]
      : Math.max(maxPositive, maxNegative);

    // Y scale: [-maxVal, +maxVal] (symmetric)
    const y = d3
      .scaleLinear()
      .domain([-maxVal, maxVal])
      .nice()
      .range([height - marginBottom, marginTop]);

    // --- Positive bars (upward) ---
    svg
      .append("g")
      .selectAll("rect")
      .data(data.filter((d) => d[positiveKey] != null))
      .join("rect")
      .attr("x", (d) => x(String(d[categoryKey]))!)
      .attr("y", (d) => y(Number(d[positiveKey])))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(Number(d[positiveKey])))
      .attr("fill", positiveColor)
      .attr("opacity", 0.85)
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        showTooltip(event, String(d[categoryKey]), {
          value: Number(d[positiveKey]),
          categoryName: positiveName,
          unit,
        });
      })
      .on("mousemove", (event) => updateTooltipPosition(event))
      .on("mouseleave", () => hideTooltip());

    // --- Negative bars (downward) ---
    svg
      .append("g")
      .selectAll("rect")
      .data(data.filter((d) => d[negativeKey] != null))
      .join("rect")
      .attr("x", (d) => x(String(d[categoryKey]))!)
      .attr("y", y(0))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(-Number(d[negativeKey])) - y(0))
      .attr("fill", negativeColor)
      .attr("opacity", 0.85)
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        showTooltip(event, String(d[categoryKey]), {
          value: Number(d[negativeKey]),
          categoryName: negativeName,
          unit,
        });
      })
      .on("mousemove", (event) => updateTooltipPosition(event))
      .on("mouseleave", () => hideTooltip());

    // --- Zero line ---
    svg
      .append("line")
      .attr("x1", marginLeft)
      .attr("x2", width - marginRight)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.3);

    // --- X axis ---
    const catValues = data.map((d) => String(d[categoryKey]));
    const tickInterval = 5;
    const tickValues = catValues.filter((val) => {
      const row = data.find((d) => String(d[categoryKey]) === val);
      const code = String(row?.yearCode ?? val);
      const num = parseInt(code, 10);
      return !isNaN(num) && num % tickInterval === 0;
    });

    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(tickValues.length > 0 ? tickValues : catValues)
          .tickFormat((val) => {
            const row = data.find((d) => String(d[categoryKey]) === val);
            return (row?.label ?? val) as string;
          })
          .tickSizeOuter(0),
      )
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("dy", "8"));

    // --- Y axis ---
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(innerHeight / 50)
          .tickFormat((v) => formatY(Number(v))),
      )
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke-opacity", 0).clone()
          .attr("x2", innerWidth)
          .attr("stroke-opacity", CHART_STYLES.grid.strokeOpacity)
      )
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("dx", "-4"));
  }, [
    data,
    categoryKey,
    positiveKey,
    negativeKey,
    positiveName,
    negativeName,
    positiveColor,
    negativeColor,
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    baseFontSize,
    innerHeight,
    innerWidth,
    unit,
    yDomain,
    formatY,
    showTooltip,
    hideTooltip,
    updateTooltipPosition,
  ]);

  return (
    <div className={cn("relative flex flex-col w-full", className)}>
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
