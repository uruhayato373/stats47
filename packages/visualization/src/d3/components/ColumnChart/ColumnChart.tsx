"use client";

import { resolveChartDomain, stackedNumericValues } from '@stats47/types';

import { cn } from "@stats47/components";

import {
  schemeTableau10,
  select,
  stack,
  stackOffsetDiverging,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  axisBottom,
  axisLeft,
} from "d3";
import { useEffect, useRef } from "react";
import {
  computeChartLayout,
  computeFontSize,
  computeMarginsByRatio,
} from "../../../shared/layout";
import { CHART_STYLES } from "../../constants";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { ColumnChartProps } from "./types";
import { fitSvgViewBox } from "../../utils/fit-svg-viewbox";

/**
 * ColumnChart - 垂直方向の積み上げ棒グラフ
 */
export function ColumnChart({
  data,
  yDomain,
  indexBy,
  keys,
  width = 800,
  height = 500,
  marginTop: propsMarginTop,
  marginRight: propsMarginRight,
  marginBottom: propsMarginBottom,
  marginLeft: propsMarginLeft,
  yAxisFormatter = (d) => (d / 1e6).toFixed(0) + "M",
  colors = schemeTableau10,
  isLoading = false,
  tooltipFormatter,
  unit = "",
}: ColumnChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  // --- レイアウト計算 ---
  const marginsByRatio = computeMarginsByRatio(width, height, CHART_STYLES.margin.compact);

  const layout = computeChartLayout(width, height, {
    marginTop: propsMarginTop ?? marginsByRatio.marginTop,
    marginRight: propsMarginRight ?? marginsByRatio.marginRight,
    marginBottom: propsMarginBottom ?? marginsByRatio.marginBottom,
    marginLeft: propsMarginLeft ?? marginsByRatio.marginLeft,
  });

  const { innerWidth, innerHeight, marginTop, marginLeft, marginRight, marginBottom } = layout;
  const baseFontSize = computeFontSize(width, height, CHART_STYLES.font.sizeRatio);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    // --- スタック計算 ---
    const series = stack<ColumnChartProps["data"][number]>()
      .keys(keys).value((row, key) => typeof row[key] === "number" && Number.isFinite(row[key]) ? Number(row[key]) : 0).offset(stackOffsetDiverging)(data);

    // --- スケール設定 ---
    const x = scaleBand()
      .domain(data.map((d) => d[indexBy] as string))
      .range([marginLeft, width - marginRight])
      .padding(0.1);

    const domain = resolveChartDomain(stackedNumericValues(data, keys), {mode: 'zero'}, yDomain);
    if (!domain) return;
    const y = scaleLinear()
      .domain(domain)
      .rangeRound([height - marginBottom, marginTop]);

    const color = scaleOrdinal<string>().domain(keys).range(colors);

    // --- 描画 ---
    // Bars
    svg
      .append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d.filter(v => typeof v.data[d.key] === "number" && Number.isFinite(v.data[d.key])).map(v => Object.assign(v, {key:d.key})))
      .join("rect")
      .attr("x", (d) => x(String(d.data[indexBy]))!)
      .attr("y", (d) => Math.min(y(d[0]), y(d[1])))
      .attr("height", (d) => Math.abs(y(d[0]) - y(d[1])))
      .attr("width", x.bandwidth())
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        showTooltip(event, String(d.data[indexBy]), {
          value: Number(d.data[d.key]),
          unit,
          metricTitle: d.key ?? keys[0],
        });
      })
      .on("mousemove", (event) => updateTooltipPosition(event))
      .on("mouseleave", () => hideTooltip());

    // X Axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(axisBottom(x).tickSizeOuter(0))
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("dy", "8"));

    // Y Axis
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(axisLeft(y).ticks(innerHeight / 40, "s"))
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke-opacity", 0).clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", CHART_STYLES.grid.strokeOpacity)
      )
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("dx", "-4"));

    fitSvgViewBox(svgRef.current, width, height);
  }, [data, yDomain, indexBy, keys, width, height, yAxisFormatter, colors, marginTop, marginBottom, marginLeft, marginRight, baseFontSize, innerHeight, unit, showTooltip, hideTooltip, updateTooltipPosition]);

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
          role="img"
          aria-label={`積み上げ縦棒グラフ。系列: ${keys.join("、")}。項目数: ${data.length}。単位: ${unit || "未設定"}`}
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
