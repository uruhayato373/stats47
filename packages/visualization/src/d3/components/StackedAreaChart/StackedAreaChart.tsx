"use client";

import { cn } from "@stats47/components";
import { select, scalePoint, stack, stackOrderNone, stackOffsetNone, max, scaleLinear, area, curveMonotoneX, axisBottom, axisLeft } from "d3";
import type { SeriesPoint } from "d3";
import { useEffect, useRef } from "react";
import {
  computeChartLayout,
  computeFontSize,
  computeMarginsByRatio,
  leftMarginForTickLabels,
} from "../../../shared/layout";
import { CHART_STYLES, compactAxisFormat } from "../../constants";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import { D3ChartLegend } from "../shared/D3ChartLegend";
import type { D3StackedAreaChartProps, StackedAreaDataNode } from "./types";

function defaultFormat(value: number): string {
  return value.toLocaleString();
}

/**
 * D3 StackedAreaChart - 積み上げ面グラフ（100% 積み上げ対応）
 *
 * `stack()` + `area()` で描画。
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
  const { showStackedTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  const marginsByRatio = computeMarginsByRatio(width, height, CHART_STYLES.margin.timeSeries);

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
  const legendItems = series.map((s) => ({
    key: s.key,
    label: s.label,
    color: s.color,
    marker: "square" as const,
    opacity: 0.7,
  }));

  const defaultYFormat = normalize
    ? (v: number) => `${Math.round(v)}%`
    : compactAxisFormat;
  const yFormat = yAxisFormatter ?? defaultYFormat;
  const categoryLabels = data
    .map((row) => String(row.label ?? row[categoryKey] ?? ""))
    .filter(Boolean);
  const firstCategory = categoryLabels[0];
  const lastCategory = categoryLabels[categoryLabels.length - 1];
  const accessibleLabel = [
    title ? `積み上げ面グラフ「${title}」` : "積み上げ面グラフ",
    `系列: ${series.map((item) => item.label).join("、")}`,
    firstCategory
      ? `期間: ${firstCategory === lastCategory ? firstCategory : `${firstCategory}から${lastCategory}`}`
      : undefined,
    `単位: ${normalize ? "%" : unit || "未設定"}`,
  ]
    .filter(Boolean)
    .join("。");

  useEffect(() => {
    if (!svgRef.current || !data.length || !series.length) return;

    const svg = select(svgRef.current);
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

    // Stack
    const stackGen = stack<StackedAreaDataNode>()
      .keys(keys)
      .value((d, key) => Number(d[key]) || 0)
      .order(stackOrderNone)
      .offset(stackOffsetNone);

    const stackedData = stackGen(processedData);

    // Y scale
    const yMax = normalize
      ? 100
      : max(stackedData, (layer) => max(layer, (d) => d[1])) ?? 0;
    const computedDomain: [number, number] = [0, yMax];
    const y = scaleLinear()
      .domain(!normalize && yDomainProp ? yDomainProp : computedDomain)
      .nice()
      .range([height - marginBottom, marginTop]);

    // 縦軸のラベルが左端で切れないよう、目盛りの実際の文字列から左余白を決める
    const yTicks = y.ticks(innerHeight / 40);
    const plotLeft = leftMarginForTickLabels(
      yTicks.map((v) => yFormat(Number(v))),
      baseFontSize,
      marginLeft,
    );

    // X scale
    const catValues = processedData.map((d) => String(d[categoryKey] ?? ""));
    const x = scalePoint()
      .domain(catValues)
      .range([plotLeft, width - marginRight]);

    // Area generator
    const areaFn = area<SeriesPoint<StackedAreaDataNode>>()
      .x((d) => x(String(d.data[categoryKey] ?? "")) ?? 0)
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(curveMonotoneX);

    // Draw areas. The category overlay below owns the shared value tooltip.
    svg
      .append("g")
      .selectAll("path")
      .data(stackedData)
      .join("path")
      .attr("fill", (d) => colorMap.get(d.key) ?? "#888")
      .attr("fill-opacity", 0.7)
      .attr("d", areaFn)
      .attr("class", "transition-opacity duration-200");

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
        const total = keys.reduce((sum, k) => sum + (Number(d[k]) || 0), 0);
        const items = series.map((s) => {
          const val = Number(d[s.key]) || 0;
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
          return {
            name: s.label,
            value: val,
            color: s.color,
            unit: normalize ? "%" : unit,
            detail: normalize ? undefined : `(${pct}%)`,
          };
        });
        showStackedTooltip(event, categoryLabel, items, {
          formatter: tooltipFormatter,
        });
      })
      .on("mousemove", (event: MouseEvent) => updateTooltipPosition(event))
      .on("mouseleave", () => {
        hoverLine.attr("stroke-opacity", 0);
        hideTooltip();
      });

    // X axis — 5年ごとに間引き
    const tickInterval = 5;
    const filteredTicks = catValues.filter((val) => {
      const row = processedData.find((d) => String(d[categoryKey]) === val);
      const code = String((row as Record<string, unknown>)?.yearCode ?? val);
      const num = parseInt(code, 10);
      return !isNaN(num) && num % tickInterval === 0;
    });
    const xAxis = axisBottom(x)
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
    const yAxis = axisLeft(y)
      .tickValues(yTicks)
      .tickFormat((v) => yFormat(Number(v)));
    svg
      .append("g")
      .attr("transform", `translate(${plotLeft},0)`)
      .call(yAxis)
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke-opacity", 0).clone()
          .attr("x2", width - plotLeft - marginRight)
          .attr("stroke-opacity", CHART_STYLES.grid.strokeOpacity)
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
    showStackedTooltip,
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
