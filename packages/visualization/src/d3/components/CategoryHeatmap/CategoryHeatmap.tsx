"use client";

import { cn } from "@stats47/components";
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { computeChartLayout, computeMarginsByRatio } from "../../../shared/layout";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { CategoryHeatmapProps } from "./types";

/**
 * CategoryHeatmap — 年×品目のヒートマップ
 *
 * Observable @mbostock/electric-usage-2019 を参考に、
 * 時系列×カテゴリの2次元で値の変化を色濃度で表示する。
 */
export function CategoryHeatmap({
  data,
  baseline = 100,
  positiveColor = "#3b82f6",
  negativeColor = "#f97316",
  unit = "",
  width = 600,
  height = 300,
  className,
}: CategoryHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  const marginsByRatio = computeMarginsByRatio(width, height, {
    top: 24 / 300,
    right: 10 / 600,
    bottom: 8 / 300,
    left: 100 / 600,
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

    // X/Y ドメイン
    const xLabels = [...new Set(data.map((d) => d.x))];
    const yLabels = [...new Set(data.map((d) => d.y))];

    const x = d3.scaleBand().domain(xLabels).range([0, innerWidth]).padding(0.05);
    const y = d3.scaleBand().domain(yLabels).range([0, innerHeight]).padding(0.05);

    // 色スケール（基準値を中心にした diverging）
    const values = data.map((d) => d.value);
    const maxDeviation = Math.max(
      Math.abs(Math.min(...values) - baseline),
      Math.abs(Math.max(...values) - baseline)
    ) || 1;

    const getColor = (value: number): string => {
      const deviation = value - baseline;
      const t = deviation / maxDeviation; // -1 to +1
      if (Math.abs(t) < 0.05) return "hsl(var(--muted))";
      if (t > 0) {
        return d3.interpolateRgb("#dbeafe", positiveColor)(Math.abs(t));
      }
      return d3.interpolateRgb("#ffedd5", negativeColor)(Math.abs(t));
    };

    const g = svg
      .append("g")
      .attr("transform", `translate(${marginLeft},${marginTop})`);

    // X軸ラベル（上部、年）
    g.append("g")
      .selectAll("text")
      .data(xLabels)
      .join("text")
      .attr("x", (d) => x(d)! + x.bandwidth() / 2)
      .attr("y", -4)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("font-size", "9px")
      .text((d) => d.replace("年", ""));

    // Y軸ラベル（左側、品目）
    g.append("g")
      .selectAll("text")
      .data(yLabels)
      .join("text")
      .attr("x", -6)
      .attr("y", (d) => y(d)! + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("fill", "hsl(var(--foreground))")
      .attr("font-size", "10px")
      .text((d) => d);

    // セル
    g.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.x)!)
      .attr("y", (d) => y(d.y)!)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("rx", 2)
      .attr("fill", (d) => getColor(d.value))
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 1)
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("stroke", "hsl(var(--foreground))").attr("stroke-width", 2);
        const diff = d.value - baseline;
        const sign = diff >= 0 ? "+" : "";
        showTooltip(event, d.y, {
          value: d.value,
          categoryName: `${d.x} / 全国平均比: ${sign}${diff.toFixed(1)}`,
          unit,
        });
      })
      .on("mousemove", (event) => updateTooltipPosition(event))
      .on("mouseleave", function () {
        d3.select(this).attr("stroke", "hsl(var(--background))").attr("stroke-width", 1);
        hideTooltip();
      });

    // セル内に値テキスト（セルが十分大きい場合のみ）
    if (x.bandwidth() >= 28 && y.bandwidth() >= 18) {
      g.selectAll(".cell-text")
        .data(data)
        .join("text")
        .attr("class", "cell-text")
        .attr("x", (d) => x(d.x)! + x.bandwidth() / 2)
        .attr("y", (d) => y(d.y)! + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", (d) => {
          const t = Math.abs((d.value - baseline) / maxDeviation);
          return t > 0.6 ? "#fff" : "hsl(var(--foreground))";
        })
        .attr("font-size", "8px")
        .text((d) => d.value.toFixed(1));
    }
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
