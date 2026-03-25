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
import type { MixedChartProps } from "./types";

function defaultFormat(value: number): string {
  return value.toLocaleString();
}

/**
 * MixedChart - 棒グラフ（左Y軸）+ 折れ線グラフ（右Y軸）の2軸チャート
 */
export function MixedChart({
  data,
  categoryKey = "category",
  columns,
  lines,
  width = 800,
  height = 500,
  marginTop: propsMarginTop,
  marginRight: propsMarginRight,
  marginBottom: propsMarginBottom,
  marginLeft: propsMarginLeft,
  leftUnit = "",
  rightUnit = "",
  leftAxisFormatter = defaultFormat,
  rightAxisFormatter = defaultFormat,
  unit = "",
  colors = d3.schemeTableau10,
  isLoading = false,
  className,
}: MixedChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  const marginsByRatio = computeMarginsByRatio(width, height, CHART_STYLES.margin.dualAxis);

  const layout = computeChartLayout(width, height, {
    marginTop: propsMarginTop ?? marginsByRatio.marginTop,
    marginRight: propsMarginRight ?? marginsByRatio.marginRight,
    marginBottom: propsMarginBottom ?? marginsByRatio.marginBottom,
    marginLeft: propsMarginLeft ?? marginsByRatio.marginLeft,
  });

  const { innerWidth, innerHeight, marginTop, marginLeft, marginRight, marginBottom } = layout;
  const baseFontSize = computeFontSize(width, height, CHART_STYLES.font.sizeRatio);

  const allSeries = [...columns, ...lines];

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const catValues = data.map((d) => String(d[categoryKey] ?? ""));

    // X軸: バンドスケール（棒の幅用）
    const x = d3
      .scaleBand()
      .domain(catValues)
      .range([marginLeft, width - marginRight])
      .padding(0.2);

    // 左Y軸: 棒グラフ用
    const colKeys = columns.map((c) => c.dataKey);
    const colValues = data.flatMap((d) =>
      colKeys.map((k) => d[k]).filter((v): v is number => typeof v === "number")
    );
    const yLeft = d3
      .scaleLinear()
      .domain([0, d3.max(colValues) ?? 0])
      .nice()
      .range([height - marginBottom, marginTop]);

    // 右Y軸: 折れ線用
    const lineKeys = lines.map((l) => l.dataKey);
    const lineValues = data.flatMap((d) =>
      lineKeys.map((k) => d[k]).filter((v): v is number => typeof v === "number")
    );
    const yRight = d3
      .scaleLinear()
      .domain([0, d3.max(lineValues) ?? 0])
      .nice()
      .range([height - marginBottom, marginTop]);

    // --- 棒グラフ描画 ---
    const barWidth = x.bandwidth() / Math.max(columns.length, 1);
    columns.forEach((col, colIdx) => {
      svg
        .append("g")
        .selectAll("rect")
        .data(data.filter((d) => d[col.dataKey] != null))
        .join("rect")
        .attr("x", (d) => (x(String(d[categoryKey])) ?? 0) + barWidth * colIdx)
        .attr("y", (d) => yLeft(Number(d[col.dataKey])))
        .attr("width", barWidth)
        .attr("height", (d) => yLeft(0) - yLeft(Number(d[col.dataKey])))
        .attr("fill", col.color)
        .attr("opacity", 0.8)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
          const label = (d.label as string) ?? String(d[categoryKey]);
          showTooltip(event, label, {
            value: Number(d[col.dataKey]),
            categoryName: col.name,
            unit: leftUnit || unit,
          });
        })
        .on("mousemove", (event) => updateTooltipPosition(event))
        .on("mouseleave", () => hideTooltip());
    });

    // --- 折れ線描画 ---
    const xCenter = (d: Record<string, string | number | undefined>) =>
      (x(String(d[categoryKey])) ?? 0) + x.bandwidth() / 2;

    lines.forEach((s) => {
      const filtered = data.filter((d) => d[s.dataKey] != null);

      const lineFn = d3
        .line<(typeof filtered)[number]>()
        .x((d) => xCenter(d))
        .y((d) => yRight(Number(d[s.dataKey])));

      svg
        .append("path")
        .datum(filtered)
        .attr("fill", "none")
        .attr("stroke", s.color)
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", lineFn);

      // ドット
      svg
        .append("g")
        .selectAll("circle")
        .data(filtered)
        .join("circle")
        .attr("cx", (d) => xCenter(d))
        .attr("cy", (d) => yRight(Number(d[s.dataKey])))
        .attr("r", 4)
        .attr("fill", s.color)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
          const label = (d.label as string) ?? String(d[categoryKey]);
          showTooltip(event, label, {
            value: Number(d[s.dataKey]),
            categoryName: s.name,
            unit: rightUnit || unit,
          });
        })
        .on("mousemove", (event) => updateTooltipPosition(event))
        .on("mouseleave", () => hideTooltip());
    });

    // --- X軸（5年ごとに間引き） ---
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
          .tickValues(tickValues)
          .tickFormat((val) => {
            const row = data.find((d) => String(d[categoryKey]) === val);
            return (row?.label ?? val) as string;
          })
          .tickSizeOuter(0)
      )
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("dy", "8"));

    // --- 左Y軸 ---
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(
        d3
          .axisLeft(yLeft)
          .ticks(innerHeight / 40)
          .tickFormat((v) => leftAxisFormatter(Number(v)))
      )
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke-opacity", 0).clone()
          .attr("x2", innerWidth)
          .attr("stroke-opacity", CHART_STYLES.grid.strokeOpacity)
      )
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("fill", columns[0]?.color ?? "#666").attr("dx", "-4"));

    // --- 右Y軸 ---
    svg
      .append("g")
      .attr("transform", `translate(${width - marginRight},0)`)
      .call(
        d3
          .axisRight(yRight)
          .ticks(innerHeight / 40)
          .tickFormat((v) => rightAxisFormatter(Number(v)))
      )
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("fill", lines[0]?.color ?? "#666"));
  }, [
    data, categoryKey, columns, lines, width, height,
    marginTop, marginRight, marginBottom, marginLeft,
    baseFontSize, innerHeight, innerWidth, leftUnit, rightUnit, unit,
    leftAxisFormatter, rightAxisFormatter, colors,
    showTooltip, hideTooltip, updateTooltipPosition,
  ]);

  return (
    <div className={cn("relative flex flex-col w-full", className)}>
      {allSeries.length > 1 && (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 mb-1">
          {allSeries.map((s, i) => (
            <div key={s.dataKey} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              {i < columns.length ? (
                <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: s.color, opacity: 0.8 }} />
              ) : (
                <span className="inline-block h-[3px] w-4 rounded-full" style={{ backgroundColor: s.color }} />
              )}
              <span>{s.name}</span>
            </div>
          ))}
        </div>
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
