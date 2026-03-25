"use client";

import { cn } from "@stats47/components";
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import {
  computeChartLayout,
  computeFontSize,
  computeMarginsByRatio,
} from "../../../shared/layout";
import { TOOLTIP_STYLES, clampTooltipPosition, useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { D3StackedAreaChartProps, StackedAreaDataNode } from "./types";

const TOOLTIP_ID_STACKED = "stacked-area-tooltip";

function defaultFormat(value: number): string {
  return value.toLocaleString();
}

/**
 * D3 StackedAreaChart - 積み上げ面グラフ（100% 積み上げ対応）
 *
 * `d3.stack()` + `d3.area()` で描画。
 * `normalize: true` で各カテゴリの合計を 100% に正規化する。
 */
export function StackedAreaChart({
  data,
  categoryKey = "category",
  series,
  normalize = false,
  showLegend = true,
  width = 800,
  height = 500,
  marginTop: propsMarginTop,
  marginRight: propsMarginRight,
  marginBottom: propsMarginBottom,
  marginLeft: propsMarginLeft,
  title,
  unit = "",
  isLoading = false,
  className,
  yAxisFormatter,
  tooltipFormatter = defaultFormat,
  yDomain: yDomainProp,
}: D3StackedAreaChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  const marginsByRatio = computeMarginsByRatio(width, height, {
    top: 20 / 500,
    right: 20 / 800,
    bottom: 50 / 500,
    left: 55 / 800,
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
  const baseFontSize = computeFontSize(width, height, 0.025);

  const defaultYFormat = normalize
    ? (v: number) => `${Math.round(v)}%`
    : defaultFormat;
  const yFormat = yAxisFormatter ?? defaultYFormat;

  useEffect(() => {
    if (!svgRef.current || !data.length || !series.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const keys = series.map((s) => s.key);
    const colorMap = new Map(series.map((s) => [s.key, s.color]));

    // Normalize data if needed
    let processedData: StackedAreaDataNode[];
    if (normalize) {
      processedData = data.map((d) => {
        const total = keys.reduce(
          (sum, k) => sum + (Number(d[k]) || 0),
          0
        );
        if (total === 0) return { ...d };
        const normalized: StackedAreaDataNode = {
          ...d,
        };
        for (const k of keys) {
          normalized[k] = ((Number(d[k]) || 0) / total) * 100;
        }
        return normalized;
      });
    } else {
      processedData = data;
    }

    // X scale
    const catValues = processedData.map((d) => String(d[categoryKey] ?? ""));
    const x = d3
      .scalePoint()
      .domain(catValues)
      .range([marginLeft, width - marginRight]);

    // Stack
    const stack = d3
      .stack<StackedAreaDataNode>()
      .keys(keys)
      .value((d, key) => Number(d[key]) || 0)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const stackedData = stack(processedData);

    // Y scale
    const yMax = normalize
      ? 100
      : d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1])) ?? 0;
    const computedDomain: [number, number] = [0, yMax];
    const y = d3
      .scaleLinear()
      .domain(!normalize && yDomainProp ? yDomainProp : computedDomain)
      .nice()
      .range([height - marginBottom, marginTop]);

    // Area generator
    const area = d3
      .area<d3.SeriesPoint<StackedAreaDataNode>>()
      .x((d) => x(String(d.data[categoryKey] ?? "")) ?? 0)
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(d3.curveMonotoneX);

    // Draw areas with per-series tooltips
    const labelMap = new Map(series.map((s) => [s.key, s.label]));

    svg
      .append("g")
      .selectAll("path")
      .data(stackedData)
      .join("path")
      .attr("fill", (d) => colorMap.get(d.key) ?? "#888")
      .attr("fill-opacity", 0.7)
      .attr("d", area)
      .attr("class", "transition-opacity duration-200")
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("fill-opacity", 0.9);
        const seriesLabel = labelMap.get(d.key) ?? d.key;
        showTooltip(event, seriesLabel, {
          categoryName: seriesLabel,
          unit: normalize ? "%" : unit,
        });
      })
      .on("mousemove", (event) => updateTooltipPosition(event))
      .on("mouseleave", function () {
        d3.select(this).attr("fill-opacity", 0.7);
        hideTooltip();
      });

    // Hover guideline
    const hoverLine = svg
      .append("line")
      .attr("y1", marginTop)
      .attr("y2", height - marginBottom)
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4 3")
      .style("pointer-events", "none");

    // Per-category vertical hover for value display
    const overlayWidth = innerWidth / Math.max(1, catValues.length - 1);
    svg
      .append("g")
      .selectAll("rect")
      .data(processedData)
      .join("rect")
      .attr("x", (d) => (x(String(d[categoryKey] ?? "")) ?? 0) - overlayWidth / 2)
      .attr("y", marginTop)
      .attr("width", overlayWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .style("cursor", "pointer")
      .on("mouseenter", (event: MouseEvent, d: StackedAreaDataNode) => {
        const xPos = x(String(d[categoryKey] ?? "")) ?? 0;
        hoverLine.attr("x1", xPos).attr("x2", xPos).attr("stroke-opacity", 0.4);
        const categoryLabel =
          (d.label as string) ?? String(d[categoryKey]);
        const unitStr = normalize ? "%" : unit;
        const total = keys.reduce((sum, k) => sum + (Number(d[k]) || 0), 0);
        const rows = series.map((s) => {
          const val = Number(d[s.key]) || 0;
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
          return `<div style="display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:${s.color};opacity:0.7;flex-shrink:0;"></span><span style="font-size:0.6875rem;">${s.label}</span><span style="margin-left:auto;font-variant-numeric:tabular-nums;font-weight:600;font-size:0.75rem;">${val.toLocaleString()}</span><span style="font-size:0.625rem;color:hsl(var(--muted-foreground));">${unitStr}</span><span style="font-size:0.625rem;color:hsl(var(--muted-foreground));">(${pct}%)</span></div>`;
        });
        let tooltip = document.getElementById(TOOLTIP_ID_STACKED) as HTMLDivElement | null;
        if (!tooltip) {
          tooltip = document.createElement("div");
          tooltip.id = TOOLTIP_ID_STACKED;
          Object.assign(tooltip.style, TOOLTIP_STYLES);
          document.body.appendChild(tooltip);
        }
        tooltip.innerHTML = `<div style="display:grid;gap:4px;"><div style="font-weight:500;border-bottom:1px solid hsl(var(--border));padding-bottom:4px;margin-bottom:2px;">${categoryLabel}</div>${rows.join("")}</div>`;
        tooltip.style.opacity = "1";
        clampTooltipPosition(tooltip, event.pageX, event.pageY);
      })
      .on("mousemove", (event: MouseEvent) => {
        const tooltip = document.getElementById(TOOLTIP_ID_STACKED) as HTMLDivElement | null;
        if (tooltip) {
          clampTooltipPosition(tooltip, event.pageX, event.pageY);
        }
      })
      .on("mouseleave", () => {
        hoverLine.attr("stroke-opacity", 0);
        const tooltip = document.getElementById(TOOLTIP_ID_STACKED);
        if (tooltip) tooltip.style.opacity = "0";
      });

    // X axis — 5年ごとに間引き
    const tickInterval = 5;
    const filteredTicks = catValues.filter((val) => {
      const row = processedData.find((d) => String(d[categoryKey]) === val);
      const code = String((row as Record<string, unknown>)?.yearCode ?? val);
      const num = parseInt(code, 10);
      return !isNaN(num) && num % tickInterval === 0;
    });
    const xAxis = d3
      .axisBottom(x)
      .tickValues(filteredTicks.length > 0 ? filteredTicks : catValues)
      .tickFormat((val) => {
        const row = processedData.find(
          (d) => String(d[categoryKey]) === val
        );
        return (row?.label ?? val) as string;
      })
      .tickSizeOuter(0);
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis)
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("dy", "8"));

    // Y axis
    const yAxis = d3
      .axisLeft(y)
      .ticks(innerHeight / 40)
      .tickFormat((v) => yFormat(Number(v)));
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke-opacity", 0).clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1)
      )
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("dx", "-4"));

    // Legend is rendered as HTML below the SVG
  }, [
    data,
    categoryKey,
    series,
    normalize,
    showLegend,
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
    yFormat,
    tooltipFormatter,
    showTooltip,
    hideTooltip,
    updateTooltipPosition,
    yDomainProp,
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
      {showLegend && series.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 mb-1">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: s.color, opacity: 0.7 }} />
              <span>{s.label}</span>
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
