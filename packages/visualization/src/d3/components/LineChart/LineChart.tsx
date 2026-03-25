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
import type { D3LineChartProps, TimeSeriesDataNode } from "./types";

const DEFAULT_COLORS = d3.schemeTableau10 as readonly string[];

/**
 * 折れ線グラフ用の Y 軸・ツールチップフォーマット（デフォルト）
 */
function defaultFormat(value: number): string {
  return value.toLocaleString();
}

/**
 * D3 LineChart - 時系列の折れ線グラフ（単一／複数系列）
 *
 * @see https://observablehq.com/@d3/line-chart
 */
export function LineChart({
  data,
  categoryKey = "category",
  valueKey = "value",
  series: seriesConfig,
  showLegend = false,
  width = 800,
  height = 500,
  marginTop: propsMarginTop,
  marginRight: propsMarginRight,
  marginBottom: propsMarginBottom,
  marginLeft: propsMarginLeft,
  title,
  unit = "",
  colors = DEFAULT_COLORS,
  isLoading = false,
  className,
  yAxisFormatter = defaultFormat,
  tooltipFormatter = defaultFormat,
  yDomain: yDomainProp,
}: D3LineChartProps) {
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

  const isMultiSeries = !!(seriesConfig && seriesConfig.length > 0);
  const legendSeries = isMultiSeries
    ? seriesConfig!
    : [{ dataKey: valueKey, name: valueKey, color: colors[0] ?? "#888" }];

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const catValues = data.map((d) => String(d[categoryKey] ?? ""));
    const x = d3
      .scalePoint()
      .domain(catValues)
      .range([marginLeft, width - marginRight]);

    const isMulti = !!(seriesConfig && seriesConfig.length > 0);
    const valueKeys = isMulti
      ? seriesConfig.map((s) => s.dataKey)
      : [valueKey];
    const allValues = data.flatMap((d) =>
      valueKeys
        .map((k) => d[k])
        .filter((v): v is number => typeof v === "number")
    );
    const yMin = allValues.length ? Math.min(...allValues) : 0;
    const yMax = allValues.length ? Math.max(...allValues) : 0;
    const computedDomain: [number, number] = [Math.min(0, yMin), yMax];
    const y = d3
      .scaleLinear()
      .domain(yDomainProp ?? computedDomain)
      .nice()
      .range([height - marginBottom, marginTop]);

    const seriesToDraw = isMulti
      ? seriesConfig!
      : [{ dataKey: valueKey, name: valueKey, color: colors[0] ?? "#888" }];

    const line = d3.line<TimeSeriesDataNode>().x((d) => x(String(d[categoryKey])) ?? 0);

    seriesToDraw.forEach((s) => {
      const filtered = data.filter((d) => d[s.dataKey] != null);
      const pathLine = line.y((d) => y(Number(d[s.dataKey])));
      svg
        .append("path")
        .datum(filtered)
        .attr("fill", "none")
        .attr("stroke", s.color)
        .attr("stroke-width", 1.5)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", pathLine);
    });

    // 5年ごとに間引き
    const tickInterval = 5;
    const allCats = data.map((d) => String(d[categoryKey] ?? ""));
    const filteredTicks = allCats.filter((val) => {
      const row = data.find((d) => String(d[categoryKey]) === val);
      const code = String((row as Record<string, unknown>)?.yearCode ?? val);
      const num = parseInt(code, 10);
      return !isNaN(num) && num % tickInterval === 0;
    });

    const xAxis = d3
      .axisBottom(x)
      .tickValues(filteredTicks)
      .tickFormat((val) => {
        const row = data.find((d) => String(d[categoryKey]) === val);
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

    const yAxis = d3
      .axisLeft(y)
      .ticks(innerHeight / 40, "s")
      .tickFormat((v) => yAxisFormatter(Number(v)));
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke-opacity", 0).clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", CHART_STYLES.grid.strokeOpacity)
      )
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("dx", "-4"));

    // データポイント（静的表示用）
    const pointRadius = 3;
    seriesToDraw.forEach((s) => {
      const filtered = data.filter((d) => d[s.dataKey] != null);
      svg
        .append("g")
        .selectAll("circle")
        .data(filtered)
        .join("circle")
        .attr("cx", (d) => x(String(d[categoryKey])) ?? 0)
        .attr("cy", (d) => y(Number(d[s.dataKey])))
        .attr("r", pointRadius)
        .attr("fill", s.color);
    });

    // --- オーバーレイ: チャート全面でツールチップ表示 ---
    const domainValues = x.domain();
    const domainPositions = domainValues.map((v) => x(v) ?? 0);

    // クロスヘアライン
    const crosshair = svg
      .append("line")
      .attr("y1", marginTop)
      .attr("y2", height - marginBottom)
      .attr("stroke", "hsl(var(--muted-foreground))")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,3")
      .attr("opacity", 0);

    // ハイライト用ドット
    const highlightDots = svg
      .append("g")
      .selectAll("circle")
      .data(seriesToDraw)
      .join("circle")
      .attr("r", 5)
      .attr("fill", (s) => s.color)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0);

    // 透明オーバーレイ
    svg
      .append("rect")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mousemove", (event) => {
        const [mouseX] = d3.pointer(event);

        // 最も近いX位置を二分探索
        let closestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < domainPositions.length; i++) {
          const dist = Math.abs(domainPositions[i] - mouseX);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = i;
          }
        }

        const closestCat = domainValues[closestIdx];
        const closestX = domainPositions[closestIdx];
        const closestData = data.find(
          (d) => String(d[categoryKey]) === closestCat
        );
        if (!closestData) return;

        // クロスヘアライン更新
        crosshair.attr("x1", closestX).attr("x2", closestX).attr("opacity", 0.5);

        // ハイライトドット更新
        highlightDots
          .attr("cx", closestX)
          .attr("cy", (s) => {
            const v = closestData[s.dataKey];
            return v != null ? y(Number(v)) : -100;
          })
          .attr("opacity", (s) => (closestData[s.dataKey] != null ? 1 : 0));

        // スタックツールチップ
        const label =
          (closestData.label as string) ?? closestCat;
        const items = seriesToDraw.map((s) => ({
          name: s.name,
          value: closestData[s.dataKey] != null ? Number(closestData[s.dataKey]) : null,
          color: s.color,
        }));
        showStackedTooltip(event, label, items, {
          unit,
          formatter: tooltipFormatter,
        });
      })
      .on("mouseleave", () => {
        crosshair.attr("opacity", 0);
        highlightDots.attr("opacity", 0);
        hideTooltip();
      });

    // 凡例は SVG 外に HTML で描画（重なり防止）
  }, [
    data,
    categoryKey,
    valueKey,
    seriesConfig,
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
    colors,
    unit,
    tooltipFormatter,
    showStackedTooltip,
    hideTooltip,
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
      {showLegend && legendSeries.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 mb-1">
          {legendSeries.map((s) => (
            <div key={s.dataKey} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block h-[3px] w-4 rounded-full" style={{ backgroundColor: s.color }} />
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
          overflow="hidden"
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
