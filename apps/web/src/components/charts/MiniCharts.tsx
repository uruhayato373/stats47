"use client";

/**
 * 汎用ミニチャートコンポーネント (shadcn 準拠・CSS変数カラー)。
 * D3 の描画ロジックは各チャートに閉じつつ、寸法・空表示・hover 判定は共通化する。
 */

import { type RefObject, useEffect, useRef } from "react";

import { useD3Tooltip } from "@stats47/visualization";
import { scaleLinear } from "d3-scale";
import { pointer, select } from "d3-selection";
import { line } from "d3-shape";

export interface ChartPoint {
  year: number;
  /** 表示単位に変換済みの値 */
  value: number;
}

const PRIMARY = "hsl(var(--primary))";
const MUTED = "hsl(var(--muted-foreground))";
const MUTED_FILL = "hsl(var(--muted))";

const MINI_CHART_WIDTH = 260;
const DEFAULT_MINI_CHART_HEIGHT = 84;
const MINI_CHART_PAD_X = 10;
const MINI_CHART_PAD_TOP = 8;
const MINI_CHART_PAD_BOTTOM = 18;
const MAX_BAR_WIDTH = 26;
const DEFAULT_STACK_SEGMENT_NAMES = ["財政調整基金", "減債基金", "その他特定目的基金"];

function getMiniChartLayout(height = DEFAULT_MINI_CHART_HEIGHT) {
  const plotWidth = MINI_CHART_WIDTH - MINI_CHART_PAD_X * 2;
  const plotHeight = height - MINI_CHART_PAD_TOP - MINI_CHART_PAD_BOTTOM;

  return {
    width: MINI_CHART_WIDTH,
    height,
    padX: MINI_CHART_PAD_X,
    padTop: MINI_CHART_PAD_TOP,
    padBottom: MINI_CHART_PAD_BOTTOM,
    plotWidth,
    plotHeight,
    plotBottom: MINI_CHART_PAD_TOP + plotHeight,
  };
}

function getBarGeometry(count: number, layout: ReturnType<typeof getMiniChartLayout>) {
  const slot = layout.plotWidth / Math.max(count, 1);
  const barWidth = Math.min(slot * 0.6, MAX_BAR_WIDTH);

  return { slot, barWidth };
}

function getSlotIndex(mouseX: number, count: number, slot: number, padX: number) {
  const bounded = Math.max(padX, Math.min(MINI_CHART_WIDTH - padX, mouseX));
  return Math.max(0, Math.min(count - 1, Math.floor((bounded - padX) / slot)));
}

function appendEdgeYearLabels(
  svg: ReturnType<typeof select<SVGSVGElement, unknown>>,
  points: ChartPoint[],
  xForIndex: (index: number) => number,
  height: number,
) {
  if (points.length === 0) return;

  svg
    .append("text")
    .attr("x", xForIndex(0))
    .attr("y", height - 4)
    .attr("font-size", 8)
    .attr("fill", MUTED)
    .attr("text-anchor", "start")
    .text(points[0].year);

  svg
    .append("text")
    .attr("x", xForIndex(points.length - 1))
    .attr("y", height - 4)
    .attr("font-size", 8)
    .attr("fill", MUTED)
    .attr("text-anchor", "end")
    .text(points[points.length - 1].year);
}

function appendCompactYearLabels(
  selection: ReturnType<typeof select<SVGGElement, unknown>>,
  point: { year: number },
  height: number,
) {
  selection
    .append("text")
    .attr("x", 0)
    .attr("y", height - 4)
    .attr("font-size", 8)
    .attr("fill", MUTED)
    .attr("text-anchor", "middle")
    .text(String(point.year).slice(2));
}

function EmptyMiniChart({ height = DEFAULT_MINI_CHART_HEIGHT }: { height?: number }) {
  return (
    <div
      className="flex items-center text-xs text-muted-foreground"
      style={{ height }}
    >
      データなし
    </div>
  );
}

function MiniChartSvg({
  svgRef,
  height,
  ariaLabel,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
  height: number;
  ariaLabel: string;
}) {
  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      viewBox={`0 0 ${MINI_CHART_WIDTH} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
    />
  );
}

interface LineProps {
  points: ChartPoint[];
  /** ツールチップに表示する系列名 */
  seriesName?: string;
  /** ツールチップの単位 */
  unit?: string;
  height?: number;
}

export function MiniLineChart({
  points,
  seriesName = "当該団体",
  unit = "",
  height = DEFAULT_MINI_CHART_HEIGHT,
}: LineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showStackedTooltip, hideTooltip } = useD3Tooltip();

  useEffect(() => {
    if (!svgRef.current || points.length === 0) return;

    const layout = getMiniChartLayout(height);
    const ys = points.map((p) => p.value);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);
    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    }

    const n = points.length;
    const xScale = scaleLinear()
      .domain([0, n - 1])
      .range([layout.padX, layout.width - layout.padX]);
    const yScale = scaleLinear()
      .domain([minY, maxY])
      .range([layout.plotBottom, layout.padTop]);
    const lineFn = line<ChartPoint>((_, i) => xScale(i), (d) => yScale(d.value));

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    if (n > 1) {
      svg
        .append("path")
        .datum(points)
        .attr("fill", "none")
        .attr("stroke", PRIMARY)
        .attr("stroke-width", 1.8)
        .attr("d", lineFn);
    }

    svg
      .append("g")
      .selectAll("circle")
      .data(points)
      .join("circle")
      .attr("cx", (_, i) => xScale(i))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", (_, i) => (i === n - 1 ? 3 : 1.8))
      .attr("fill", PRIMARY);

    appendEdgeYearLabels(svg, points, xScale, layout.height);

    const crosshair = svg
      .append("line")
      .attr("y1", layout.padTop)
      .attr("y2", layout.plotBottom)
      .attr("stroke", MUTED)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 2")
      .attr("opacity", 0);

    const dot = svg
      .append("circle")
      .attr("r", 4)
      .attr("fill", PRIMARY)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0);

    svg
      .append("rect")
      .attr("x", layout.padX)
      .attr("y", layout.padTop)
      .attr("width", layout.plotWidth)
      .attr("height", layout.plotHeight)
      .attr("fill", "transparent")
      .attr("data-mini-chart-hit-area", "line")
      .style("cursor", "crosshair")
      .on("pointermove", (event: PointerEvent) => {
        const [mouseX] = pointer(event);
        let closestIdx = 0;
        let minDist = Infinity;

        for (let i = 0; i < n; i++) {
          const dist = Math.abs(xScale(i) - mouseX);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = i;
          }
        }

        const px = xScale(closestIdx);
        const current = points[closestIdx];
        crosshair.attr("x1", px).attr("x2", px).attr("opacity", 0.5);
        dot.attr("cx", px).attr("cy", yScale(current.value)).attr("opacity", 1);
        showStackedTooltip(
          event,
          String(current.year),
          [{ name: seriesName, value: current.value, color: PRIMARY }],
          { unit },
        );
      })
      .on("pointerleave", () => {
        crosshair.attr("opacity", 0);
        dot.attr("opacity", 0);
        hideTooltip();
      });
  }, [points, height, seriesName, unit, showStackedTooltip, hideTooltip]);

  if (points.length === 0) {
    return <EmptyMiniChart height={height} />;
  }

  return <MiniChartSvg svgRef={svgRef} height={height} ariaLabel="推移" />;
}

export interface StackPoint {
  year: number;
  /** 下から積む値 (表示単位) */
  segments: number[];
}

interface StackedBarProps {
  points: StackPoint[];
  colors: string[];
  height?: number;
  segmentNames?: string[];
  unit?: string;
}

/** 積み上げ棒 (積立金内訳: 財政調整基金/減債基金/その他特定目的基金) */
export function MiniStackedBarChart({
  points,
  colors,
  height = DEFAULT_MINI_CHART_HEIGHT,
  segmentNames = DEFAULT_STACK_SEGMENT_NAMES,
  unit = "億円",
}: StackedBarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showStackedTooltip, hideTooltip } = useD3Tooltip();

  useEffect(() => {
    if (!svgRef.current || points.length === 0) return;

    const layout = getMiniChartLayout(height);
    const totals = points.map((p) => p.segments.reduce((a, b) => a + b, 0));
    const maxY = Math.max(...totals, 0) || 1;
    const n = points.length;
    const { slot, barWidth } = getBarGeometry(n, layout);

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const yearGroups = svg
      .append("g")
      .selectAll<SVGGElement, StackPoint>("g")
      .data(points)
      .join("g")
      .attr("transform", (_, i) => `translate(${layout.padX + slot * (i + 0.5)},0)`);

    yearGroups.each(function (point, i) {
      const group = select(this);
      let yCursor = layout.plotBottom;

      point.segments.forEach((segment, segmentIndex) => {
        const segmentHeight = (segment / maxY) * layout.plotHeight;
        yCursor -= segmentHeight;
        group
          .append("rect")
          .attr("x", -barWidth / 2)
          .attr("y", yCursor)
          .attr("width", barWidth)
          .attr("height", Math.max(0, segmentHeight))
          .attr("fill", colors[segmentIndex] ?? MUTED)
          .attr("opacity", i === n - 1 ? 1 : 0.6);
      });

      appendCompactYearLabels(group, point, layout.height);
    });

    const highlight = svg
      .append("rect")
      .attr("y", layout.padTop)
      .attr("width", barWidth + 6)
      .attr("height", layout.plotHeight)
      .attr("rx", 3)
      .attr("fill", MUTED_FILL)
      .attr("opacity", 0);

    svg
      .append("rect")
      .attr("x", layout.padX)
      .attr("y", layout.padTop)
      .attr("width", layout.plotWidth)
      .attr("height", layout.plotHeight)
      .attr("fill", "transparent")
      .attr("data-mini-chart-hit-area", "stacked-bar")
      .style("cursor", "crosshair")
      .on("pointermove", (event: PointerEvent) => {
        const [mouseX] = pointer(event);
        const index = getSlotIndex(mouseX, n, slot, layout.padX);
        const cx = layout.padX + slot * (index + 0.5);
        const current = points[index];

        highlight.attr("x", cx - (barWidth + 6) / 2).attr("opacity", 0.25);
        showStackedTooltip(
          event,
          String(current.year),
          current.segments.map((value, segmentIndex) => ({
            name: segmentNames[segmentIndex] ?? `系列${segmentIndex + 1}`,
            value,
            color: colors[segmentIndex] ?? MUTED,
          })),
          { unit },
        );
      })
      .on("pointerleave", () => {
        highlight.attr("opacity", 0);
        hideTooltip();
      });
  }, [points, colors, height, segmentNames, unit, showStackedTooltip, hideTooltip]);

  if (points.length === 0) {
    return <EmptyMiniChart height={height} />;
  }

  return <MiniChartSvg svgRef={svgRef} height={height} ariaLabel="内訳推移" />;
}

interface BarProps {
  points: ChartPoint[];
  height?: number;
  seriesName?: string;
  unit?: string;
}

export function MiniBarChart({
  points,
  height = DEFAULT_MINI_CHART_HEIGHT,
  seriesName = "値",
  unit = "億円",
}: BarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showStackedTooltip, hideTooltip } = useD3Tooltip();

  useEffect(() => {
    if (!svgRef.current || points.length === 0) return;

    const layout = getMiniChartLayout(height);
    const values = points.map((p) => p.value);
    const maxY = Math.max(...values, 0);
    const minY = Math.min(...values, 0);
    const span = maxY - minY || 1;
    const n = points.length;
    const { slot, barWidth } = getBarGeometry(n, layout);
    const zeroY = layout.padTop + (1 - (0 - minY) / span) * layout.plotHeight;
    const yForValue = (value: number) =>
      layout.padTop + (1 - (value - minY) / span) * layout.plotHeight;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .append("g")
      .selectAll<SVGGElement, ChartPoint>("g")
      .data(points)
      .join("g")
      .attr("transform", (_, i) => `translate(${layout.padX + slot * (i + 0.5)},0)`)
      .each(function (point, i) {
        const group = select(this);
        const valueY = yForValue(point.value);
        const top = Math.min(valueY, zeroY);
        const barHeight = Math.max(1, Math.abs(zeroY - valueY));

        group
          .append("rect")
          .attr("x", -barWidth / 2)
          .attr("y", top)
          .attr("width", barWidth)
          .attr("height", barHeight)
          .attr("fill", PRIMARY)
          .attr("opacity", i === n - 1 ? 1 : 0.55);

        appendCompactYearLabels(group, point, layout.height);
      });

    const highlight = svg
      .append("rect")
      .attr("y", layout.padTop)
      .attr("width", barWidth + 6)
      .attr("height", layout.plotHeight)
      .attr("rx", 3)
      .attr("fill", MUTED_FILL)
      .attr("opacity", 0);

    const marker = svg
      .append("circle")
      .attr("r", 4)
      .attr("fill", PRIMARY)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0);

    svg
      .append("rect")
      .attr("x", layout.padX)
      .attr("y", layout.padTop)
      .attr("width", layout.plotWidth)
      .attr("height", layout.plotHeight)
      .attr("fill", "transparent")
      .attr("data-mini-chart-hit-area", "bar")
      .style("cursor", "crosshair")
      .on("pointermove", (event: PointerEvent) => {
        const [mouseX] = pointer(event);
        const index = getSlotIndex(mouseX, n, slot, layout.padX);
        const cx = layout.padX + slot * (index + 0.5);
        const current = points[index];

        highlight.attr("x", cx - (barWidth + 6) / 2).attr("opacity", 0.25);
        marker.attr("cx", cx).attr("cy", yForValue(current.value)).attr("opacity", 1);
        showStackedTooltip(
          event,
          String(current.year),
          [{ name: seriesName, value: current.value, color: PRIMARY }],
          { unit },
        );
      })
      .on("pointerleave", () => {
        highlight.attr("opacity", 0);
        marker.attr("opacity", 0);
        hideTooltip();
      });
  }, [points, height, seriesName, unit, showStackedTooltip, hideTooltip]);

  if (points.length === 0) {
    return <EmptyMiniChart height={height} />;
  }

  return <MiniChartSvg svgRef={svgRef} height={height} ariaLabel="年次推移" />;
}
