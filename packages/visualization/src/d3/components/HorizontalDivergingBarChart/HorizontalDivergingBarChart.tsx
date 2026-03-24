"use client";

import { cn } from "@stats47/components";
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { computeChartLayout, computeMarginsByRatio } from "../../../shared/layout";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { HorizontalDivergingBarChartProps } from "./types";

/**
 * HorizontalDivergingBarChart — 基準値からの乖離を水平バーで表示
 *
 * Observable @d3/diverging-bar-chart を参考に、
 * 消費者物価地域差指数（全国平均=100）のような基準値からの乖離を可視化する。
 */
export function HorizontalDivergingBarChart({
  data,
  baseline = 100,
  positiveColor = "#3b82f6",
  negativeColor = "#f97316",
  unit = "",
  width = 500,
  height = 300,
  className,
}: HorizontalDivergingBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  const marginsByRatio = computeMarginsByRatio(width, height, {
    top: 8 / 300,
    right: 50 / 500,
    bottom: 24 / 300,
    left: 100 / 500,
  });

  const layout = computeChartLayout(width, height, {
    marginTop: marginsByRatio.marginTop,
    marginRight: marginsByRatio.marginRight,
    marginBottom: marginsByRatio.marginBottom,
    marginLeft: marginsByRatio.marginLeft,
  });

  const { innerWidth, innerHeight, marginTop, marginLeft } = layout;

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // 乖離度の大きい順にソート
    const sorted = [...data].sort(
      (a, b) => Math.abs(b.value - baseline) - Math.abs(a.value - baseline)
    );

    // X スケール（値軸）
    const values = sorted.map((d) => d.value);
    const minVal = Math.min(baseline, ...values);
    const maxVal = Math.max(baseline, ...values);
    const padding = (maxVal - minVal) * 0.15 || 2;

    const x = d3
      .scaleLinear()
      .domain([minVal - padding, maxVal + padding])
      .range([0, innerWidth]);

    // Y スケール（カテゴリ軸）
    const y = d3
      .scaleBand()
      .domain(sorted.map((d) => d.label))
      .range([0, innerHeight])
      .padding(0.25);

    const g = svg
      .append("g")
      .attr("transform", `translate(${marginLeft},${marginTop})`);

    // X 軸（上）
    g.append("g")
      .call(
        d3
          .axisTop(x)
          .ticks(5)
          .tickSize(-innerHeight)
          .tickFormat((d) => String(d))
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "hsl(var(--border))").attr("stroke-dasharray", "2,2")
      )
      .call((g) =>
        g.selectAll(".tick text").attr("fill", "hsl(var(--muted-foreground))").attr("font-size", "10px")
      );

    // 基準線（太線）
    g.append("line")
      .attr("x1", x(baseline))
      .attr("x2", x(baseline))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "hsl(var(--foreground))")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.6);

    // バー
    g.selectAll("rect")
      .data(sorted)
      .join("rect")
      .attr("x", (d) => (d.value >= baseline ? x(baseline) : x(d.value)))
      .attr("y", (d) => y(d.label)!)
      .attr("width", (d) => Math.abs(x(d.value) - x(baseline)))
      .attr("height", y.bandwidth())
      .attr("fill", (d) => (d.value >= baseline ? positiveColor : negativeColor))
      .attr("rx", 2)
      .attr("opacity", 0.85)
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("opacity", 1);
        const diff = d.value - baseline;
        const sign = diff >= 0 ? "+" : "";
        showTooltip(event, d.label, {
          value: d.value,
          categoryName: `全国平均比: ${sign}${diff.toFixed(1)}`,
          unit,
        });
      })
      .on("mousemove", (event) => {
        updateTooltipPosition(event);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 0.85);
        hideTooltip();
      });

    // Y軸ラベル（カテゴリ名）
    g.selectAll(".label")
      .data(sorted)
      .join("text")
      .attr("class", "label")
      .attr("x", (d) => (d.value >= baseline ? x(baseline) - 6 : x(baseline) + 6))
      .attr("y", (d) => y(d.label)! + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.value >= baseline ? "end" : "start"))
      .attr("fill", "hsl(var(--foreground))")
      .attr("font-size", "11px")
      .text((d) => d.label);

    // 値ラベル（バーの端）
    g.selectAll(".value-label")
      .data(sorted)
      .join("text")
      .attr("class", "value-label")
      .attr("x", (d) => (d.value >= baseline ? x(d.value) + 4 : x(d.value) - 4))
      .attr("y", (d) => y(d.label)! + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.value >= baseline ? "start" : "end"))
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("font-size", "10px")
      .text((d) => d.value.toFixed(1));
  }, [data, baseline, positiveColor, negativeColor, unit, width, height, innerWidth, innerHeight, marginTop, marginLeft, showTooltip, hideTooltip, updateTooltipPosition]);

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center min-h-[200px] text-sm text-muted-foreground", className)}>
        データがありません
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
}
