"use client";

import { cn } from "@stats47/components";
import { schemeTableau10, select, scaleBand, scaleLinear, max, line, axisBottom, axisLeft, axisRight } from "d3";
import { useEffect, useRef } from "react";
import {
  computeChartLayout,
  computeFontSize,
  computeMarginsByRatio,
} from "../../../shared/layout";
import { CHART_STYLES, compactAxisFormat } from "../../constants";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import { D3ChartLegend } from "../shared/D3ChartLegend";
import type { MixedChartProps } from "./types";

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
  leftAxisFormatter = compactAxisFormat,
  rightAxisFormatter = compactAxisFormat,
  unit = "",
  colors = schemeTableau10,
  isLoading = false,
  className,
  title,
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
  const legendItems = [
    ...columns.map((s) => ({
      key: s.dataKey,
      label: s.name,
      color: s.color,
      marker: "square" as const,
      opacity: 0.8,
    })),
    ...lines.map((s) => ({
      key: s.dataKey,
      label: s.name,
      color: s.color,
      marker: "line" as const,
    })),
  ];
  const categoryLabels = data
    .map((row) => String(row.label ?? row[categoryKey] ?? ""))
    .filter(Boolean);
  const firstCategory = categoryLabels[0];
  const lastCategory = categoryLabels[categoryLabels.length - 1];
  const categoryRange = firstCategory
    ? firstCategory === lastCategory
      ? firstCategory
      : `${firstCategory}から${lastCategory}`
    : undefined;
  const accessibleLabel = [
    title ? `棒・折れ線複合グラフ「${title}」` : "棒・折れ線複合グラフ",
    columns.length > 0
      ? `棒系列: ${columns.map((item) => item.name).join("、")}`
      : undefined,
    lines.length > 0
      ? `折れ線系列: ${lines.map((item) => item.name).join("、")}`
      : undefined,
    categoryRange ? `期間: ${categoryRange}` : undefined,
    leftUnit || unit ? `左軸単位: ${leftUnit || unit}` : undefined,
    rightUnit || unit ? `右軸単位: ${rightUnit || unit}` : undefined,
  ]
    .filter(Boolean)
    .join("。");

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const catValues = data.map((d) => String(d[categoryKey] ?? ""));

    // X軸: バンドスケール（棒の幅用）
    const x = scaleBand()
      .domain(catValues)
      .range([marginLeft, width - marginRight])
      .padding(0.2);

    // 左Y軸: 棒グラフ用
    const colKeys = columns.map((c) => c.dataKey);
    const colValues = data.flatMap((d) =>
      colKeys.map((k) => d[k]).filter((v): v is number => typeof v === "number")
    );
    const yLeft = scaleLinear()
      .domain([0, max(colValues) ?? 0])
      .nice()
      .range([height - marginBottom, marginTop]);

    // 右Y軸: 折れ線用
    const lineKeys = lines.map((l) => l.dataKey);
    const lineValues = data.flatMap((d) =>
      lineKeys.map((k) => d[k]).filter((v): v is number => typeof v === "number")
    );
    const yRight = scaleLinear()
      .domain([0, max(lineValues) ?? 0])
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
            metricTitle: col.name,
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

      const lineFn = line<(typeof filtered)[number]>()
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
            metricTitle: s.name,
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
        axisBottom(x)
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
        axisLeft(yLeft)
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
        axisRight(yRight)
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
        <D3ChartLegend items={legendItems} />
      )}
      <div className="relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label={accessibleLabel}
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
