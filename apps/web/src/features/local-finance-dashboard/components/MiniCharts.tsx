"use client";

/**
 * 地方財政ダッシュボード用のミニチャート (PBI Page1 のカード内チャート再現)。
 * - MiniLineChart: 当該団体(実線・青) + 全国平均(破線・灰)。D3インタラクティブ版。
 * - MiniBarChart: 年次の棒 (積立金現在高 / 地方債現在高)。
 */

import { useEffect, useRef } from "react";

import { useD3Tooltip } from "@stats47/visualization";
import { line, pointer, scaleLinear, select } from "d3";

export interface ChartPoint {
  year: number;
  /** 表示単位に変換済みの値 */
  value: number;
}

const BLUE = "#2563eb";
const GRAY = "#94a3b8";

interface LineProps {
  points: ChartPoint[];
  average?: ChartPoint[];
  /** ツールチップに表示する系列名 */
  seriesName?: string;
  /** 全国/類似団体 平均の系列名 */
  averageName?: string;
  /** ツールチップの単位 */
  unit?: string;
  height?: number;
}

export function MiniLineChart({
  points,
  average,
  seriesName = "当該団体",
  averageName = "全国平均",
  unit = "",
  height = 84,
}: LineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showStackedTooltip, hideTooltip } = useD3Tooltip();

  useEffect(() => {
    if (!svgRef.current || points.length === 0) return;

    const W = 260;
    const H = height;
    const padX = 10;
    const padTop = 8;
    const padBottom = 18;

    const allPts = average && average.length > 0 ? [...points, ...average] : points;
    const ys = allPts.map((p) => p.value);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);
    if (minY === maxY) { minY -= 1; maxY += 1; }

    const n = points.length;
    const xScale = scaleLinear().domain([0, n - 1]).range([padX, W - padX]);
    const yScale = scaleLinear().domain([minY, maxY]).range([H - padBottom, padTop]);

    const lineFn = line<ChartPoint>((_, i) => xScale(i), (d) => yScale(d.value));

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    // 全国平均 (破線)
    if (average && average.length > 1) {
      svg.append("path")
        .datum(average)
        .attr("fill", "none")
        .attr("stroke", GRAY)
        .attr("stroke-width", 1.3)
        .attr("stroke-dasharray", "4 3")
        .attr("d", lineFn);
    }

    // 当該団体 (実線)
    if (n > 1) {
      svg.append("path")
        .datum(points)
        .attr("fill", "none")
        .attr("stroke", BLUE)
        .attr("stroke-width", 1.8)
        .attr("d", lineFn);
    }

    // データポイント
    svg.append("g")
      .selectAll("circle")
      .data(points)
      .join("circle")
      .attr("cx", (_, i) => xScale(i))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", (_, i) => (i === n - 1 ? 3 : 1.8))
      .attr("fill", BLUE);

    // 年ラベル (最初と最後)
    if (n > 0) {
      svg.append("text").attr("x", xScale(0)).attr("y", H - 4).attr("font-size", 8).attr("fill", GRAY).attr("text-anchor", "start").text(points[0].year);
      svg.append("text").attr("x", xScale(n - 1)).attr("y", H - 4).attr("font-size", 8).attr("fill", GRAY).attr("text-anchor", "end").text(points[n - 1].year);
    }

    // クロスヘアライン
    const crosshair = svg.append("line")
      .attr("y1", padTop)
      .attr("y2", H - padBottom)
      .attr("stroke", GRAY)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 2")
      .attr("opacity", 0);

    // ハイライトドット (当該団体)
    const dot = svg.append("circle")
      .attr("r", 4)
      .attr("fill", BLUE)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0);

    // 透明オーバーレイ (インタラクション領域)
    svg.append("rect")
      .attr("x", padX)
      .attr("y", padTop)
      .attr("width", W - padX * 2)
      .attr("height", H - padTop - padBottom)
      .attr("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mousemove", (event: MouseEvent) => {
        const [mouseX] = pointer(event);
        // 最近傍インデックスを探す
        let closestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < n; i++) {
          const dist = Math.abs(xScale(i) - mouseX);
          if (dist < minDist) { minDist = dist; closestIdx = i; }
        }
        const px = xScale(closestIdx);
        crosshair.attr("x1", px).attr("x2", px).attr("opacity", 0.5);
        dot.attr("cx", px).attr("cy", yScale(points[closestIdx].value)).attr("opacity", 1);

        const items = [
          { name: seriesName, value: points[closestIdx].value, color: BLUE },
          ...(average && average[closestIdx] != null
            ? [{ name: averageName, value: average[closestIdx].value, color: GRAY }]
            : []),
        ];
        showStackedTooltip(event, String(points[closestIdx].year), items, { unit });
      })
      .on("mouseleave", () => {
        crosshair.attr("opacity", 0);
        dot.attr("opacity", 0);
        hideTooltip();
      });
  }, [points, average, height, seriesName, averageName, unit, showStackedTooltip, hideTooltip]);

  if (points.length === 0) {
    return <div className="flex h-[84px] items-center text-xs text-muted-foreground">データなし</div>;
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      viewBox={`0 0 260 ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="推移"
    />
  );
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
}

/** 積み上げ棒 (積立金内訳: 財政調整基金/減債基金/その他特定目的基金) */
export function MiniStackedBarChart({ points, colors, height = 84 }: StackedBarProps) {
  const W = 260;
  const H = height;
  const padX = 10;
  const padTop = 8;
  const padBottom = 18;
  if (points.length === 0) {
    return <div className="flex h-[84px] items-center text-xs text-muted-foreground">データなし</div>;
  }
  const totals = points.map((p) => p.segments.reduce((a, b) => a + b, 0));
  const maxY = Math.max(...totals, 0) || 1;
  const n = points.length;
  const slot = (W - padX * 2) / n;
  const barW = Math.min(slot * 0.6, 26);
  const plotH = H - padTop - padBottom;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="内訳推移">
      {points.map((p, i) => {
        const cx = padX + slot * (i + 0.5);
        let yCursor = padTop + plotH;
        return (
          <g key={p.year}>
            {p.segments.map((seg, si) => {
              const h = (seg / maxY) * plotH;
              yCursor -= h;
              return <rect key={si} x={cx - barW / 2} y={yCursor} width={barW} height={Math.max(0, h)} fill={colors[si] ?? "#94a3b8"} opacity={i === n - 1 ? 1 : 0.6} />;
            })}
            <text x={cx} y={H - 4} fontSize="8" fill="#94a3b8" textAnchor="middle">
              {String(p.year).slice(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface BarProps {
  points: ChartPoint[];
  height?: number;
}

export function MiniBarChart({ points, height = 84 }: BarProps) {
  const W = 260;
  const H = height;
  const padX = 10;
  const padTop = 8;
  const padBottom = 18;
  if (points.length === 0) {
    return <div className="flex h-[84px] items-center text-xs text-muted-foreground">データなし</div>;
  }
  const maxY = Math.max(...points.map((p) => p.value), 0);
  const minY = Math.min(...points.map((p) => p.value), 0);
  const span = maxY - minY || 1;
  const n = points.length;
  const slot = (W - padX * 2) / n;
  const barW = Math.min(slot * 0.6, 26);
  const zeroY = padTop + (1 - (0 - minY) / span) * (H - padTop - padBottom);

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="年次推移">
      {points.map((p, i) => {
        const cx = padX + slot * (i + 0.5);
        const vy = padTop + (1 - (p.value - minY) / span) * (H - padTop - padBottom);
        const top = Math.min(vy, zeroY);
        const h = Math.max(1, Math.abs(zeroY - vy));
        return (
          <g key={p.year}>
            <rect x={cx - barW / 2} y={top} width={barW} height={h} fill={BLUE} opacity={i === n - 1 ? 1 : 0.55} />
            <text x={cx} y={H - 4} fontSize="8" fill={GRAY} textAnchor="middle">
              {String(p.year).slice(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
