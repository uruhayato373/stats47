"use client";

/**
 * 汎用ミニチャートコンポーネント (shadcn 準拠・CSS変数カラー)。
 * D3 の描画ロジックは各チャートに閉じつつ、寸法・空表示・hover 判定は共通化する。
 */

import { type RefObject, useCallback, useEffect, useId, useRef, useState } from "react";

import { useD3Tooltip } from "@stats47/visualization";
import { scaleLinear } from "d3-scale";
import { pointer, select } from "d3-selection";
import { area, curveMonotoneX, line } from "d3-shape";

export interface ChartPoint {
  year: number;
  /** 表示単位に変換済みの値 */
  value: number;
}

const PRIMARY = "hsl(var(--primary))";
const MUTED = "hsl(var(--muted-foreground))";
const MUTED_FILL = "hsl(var(--muted))";
/** 推移の線と面の色。テーマのほかの図の 1 本目の系列と同じ色 (ChartPalette の CHART_COLORS[0]) */
const MINI_LINE_COLOR = "hsl(var(--chart-1))";
/** 面の塗りの上端の濃さ。線が主役で、面は形を見やすくする補助 (縦軸が 0 から始まらないので量に見せない) */
const MINI_LINE_FILL_OPACITY = 0.2;
/** 最小の値の下にとる余白 (値の幅に対する割合)。線が下端に付かないようにする */
const MINI_LINE_BOTTOM_HEADROOM = 0.15;

/** 親の幅を測る前 (SSR・初回描画) に使う描画幅。測れたら親の幅いっぱいに描き直す */
const FALLBACK_MINI_CHART_WIDTH = 320;
const DEFAULT_MINI_CHART_HEIGHT = 84;
const MINI_CHART_PAD_X = 10;
const MINI_CHART_PAD_TOP = 8;
const MINI_CHART_PAD_BOTTOM = 18;
const MAX_BAR_WIDTH = 26;
/**
 * 年のラベルの文字サイズ (px)。ミニチャートは viewBox を表示幅に合わせて等倍で描くので、
 * この値がそのまま画面上の大きさになる。8 では読めなかった (2026-09-25 CHART-AXIS-READABILITY-01)。
 */
const YEAR_LABEL_FONT_SIZE = 10;
/** 棒ごとの年 (西暦の下 2 桁) のラベルの幅。半角 2 文字 + 隣との余白 */
const COMPACT_YEAR_LABEL_WIDTH = YEAR_LABEL_FONT_SIZE * 1.2 + 2;
const DEFAULT_STACK_SEGMENT_NAMES = ["財政調整基金", "減債基金", "その他特定目的基金"];

/**
 * SVG 自身 (width=100%) の描画幅を測り、viewBox を親の幅に合わせる。
 * 「データなし」から描画に切り替わったときも測れるよう、callback ref で要素を受け取る。
 */
function useMiniChartWidth(svgRef: RefObject<SVGSVGElement | null>) {
  const [node, setNode] = useState<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(FALLBACK_MINI_CHART_WIDTH);

  const attachRef = useCallback(
    (el: SVGSVGElement | null) => {
      svgRef.current = el;
      setNode(el);
    },
    [svgRef],
  );

  useEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return { width, attachRef };
}

function getMiniChartLayout(height = DEFAULT_MINI_CHART_HEIGHT, width = FALLBACK_MINI_CHART_WIDTH) {
  const plotWidth = width - MINI_CHART_PAD_X * 2;
  const plotHeight = height - MINI_CHART_PAD_TOP - MINI_CHART_PAD_BOTTOM;

  return {
    width,
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

/**
 * 棒ごとの年のラベルを何本おきに出すか。棒の間隔がラベルの幅より狭いときは等間隔に間引く。
 * 最新の年 (右端の棒) を必ず残す。
 */
function shouldLabelYear(index: number, count: number, slot: number): boolean {
  const step = Math.max(1, Math.ceil(COMPACT_YEAR_LABEL_WIDTH / slot));
  return (count - 1 - index) % step === 0;
}

function getSlotIndex(mouseX: number, count: number, slot: number, padX: number, width: number) {
  const bounded = Math.max(padX, Math.min(width - padX, mouseX));
  return Math.max(0, Math.min(count - 1, Math.floor((bounded - padX) / slot)));
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
    .attr("font-size", YEAR_LABEL_FONT_SIZE)
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
  width,
  height,
  ariaLabel,
}: {
  svgRef: (el: SVGSVGElement | null) => void;
  width: number;
  height: number;
  ariaLabel: string;
}) {
  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
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
  const { width, attachRef } = useMiniChartWidth(svgRef);
  const { showStackedTooltip, hideTooltip } = useD3Tooltip();
  // 面の塗りのグラデーションの id。同じページに何枚並んでも互いに参照しないよう部品ごとに分ける
  const gradientId = `mini-line-fill-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (!svgRef.current || points.length === 0) return;

    // 線と、下へ向けて透明になる面だけの推移 (2026-11-24 オーナー指示)。年の目盛りと各年の点は描かず、
    // 年と値はホバーのツールチップで読む。左右と下の余白は持たず、置き場 (StatTile の chart) の端まで描く。
    const layout = getMiniChartLayout(height, width);
    const plotLeft = 0;
    const plotRight = layout.width;
    const plotBottom = layout.height;
    const ys = points.map((p) => p.value);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);
    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    }
    // 縦軸は 0 から始めない (最小〜最大)。面は量ではなく形を見せる補助なので、最小の値でも
    // 線が下端に付かないよう下に余白をとり、塗りは薄くして下へすぐ透明にする
    const headroom = (maxY - minY) * MINI_LINE_BOTTOM_HEADROOM;

    const n = points.length;
    const xScale = scaleLinear().domain([0, Math.max(n - 1, 1)]).range([plotLeft, plotRight]);
    const yScale = scaleLinear()
      .domain([minY - headroom, maxY])
      .range([plotBottom, layout.padTop]);
    // 点を越えない曲線 (年と年の間に実際より高い山・低い谷を描かない。2026-11-03)
    const lineFn = line<ChartPoint>((_, i) => xScale(i), (d) => yScale(d.value)).curve(curveMonotoneX);
    const areaFn = area<ChartPoint>()
      .x((_, i) => xScale(i))
      .y0(plotBottom)
      .y1((d) => yScale(d.value))
      .curve(curveMonotoneX);

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    if (n > 1) {
      const gradient = svg
        .append("defs")
        .append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 1);
      gradient.append("stop").attr("offset", "0%").attr("stop-color", MINI_LINE_COLOR).attr("stop-opacity", MINI_LINE_FILL_OPACITY);
      gradient.append("stop").attr("offset", "100%").attr("stop-color", MINI_LINE_COLOR).attr("stop-opacity", 0);

      svg.append("path").datum(points).attr("fill", `url(#${gradientId})`).attr("stroke", "none").attr("d", areaFn);
      svg
        .append("path")
        .datum(points)
        .attr("fill", "none")
        .attr("stroke", MINI_LINE_COLOR)
        .attr("stroke-width", 1.8)
        .attr("d", lineFn);
    }

    const crosshair = svg
      .append("line")
      .attr("y1", layout.padTop)
      .attr("y2", plotBottom)
      .attr("stroke", MUTED)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 2")
      .attr("opacity", 0);

    const dot = svg
      .append("circle")
      .attr("r", 4)
      .attr("fill", MINI_LINE_COLOR)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0);

    svg
      .append("rect")
      .attr("x", plotLeft)
      .attr("y", 0)
      .attr("width", plotRight - plotLeft)
      .attr("height", plotBottom)
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
          [{ name: seriesName, value: current.value, color: MINI_LINE_COLOR }],
          { unit },
        );
      })
      .on("pointerleave", () => {
        crosshair.attr("opacity", 0);
        dot.attr("opacity", 0);
        hideTooltip();
      });
  }, [points, width, height, seriesName, unit, gradientId, showStackedTooltip, hideTooltip]);

  if (points.length === 0) {
    return <EmptyMiniChart height={height} />;
  }

  return <MiniChartSvg svgRef={attachRef} width={width} height={height} ariaLabel="推移" />;
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
  const { width, attachRef } = useMiniChartWidth(svgRef);
  const { showStackedTooltip, hideTooltip } = useD3Tooltip();

  useEffect(() => {
    if (!svgRef.current || points.length === 0) return;

    const layout = getMiniChartLayout(height, width);
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

      if (shouldLabelYear(i, n, slot)) appendCompactYearLabels(group, point, layout.height);
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
        const index = getSlotIndex(mouseX, n, slot, layout.padX, layout.width);
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
  }, [points, colors, width, height, segmentNames, unit, showStackedTooltip, hideTooltip]);

  if (points.length === 0) {
    return <EmptyMiniChart height={height} />;
  }

  return <MiniChartSvg svgRef={attachRef} width={width} height={height} ariaLabel="内訳推移" />;
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
  const { width, attachRef } = useMiniChartWidth(svgRef);
  const { showStackedTooltip, hideTooltip } = useD3Tooltip();

  useEffect(() => {
    if (!svgRef.current || points.length === 0) return;

    const layout = getMiniChartLayout(height, width);
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

        if (shouldLabelYear(i, n, slot)) appendCompactYearLabels(group, point, layout.height);
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
        const index = getSlotIndex(mouseX, n, slot, layout.padX, layout.width);
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
  }, [points, width, height, seriesName, unit, showStackedTooltip, hideTooltip]);

  if (points.length === 0) {
    return <EmptyMiniChart height={height} />;
  }

  return <MiniChartSvg svgRef={attachRef} width={width} height={height} ariaLabel="年次推移" />;
}
