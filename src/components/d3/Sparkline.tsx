/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface SparklineDataPoint {
  year: string;
  value: number;
}

export interface SparklineProps {
  data: SparklineDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  className?: string;
  showTooltip?: boolean;
}

/**
 * シンプルなスパークライン（小さな折れ線グラフ）コンポーネント
 */
export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 200,
  height = 40,
  color = "#4f46e5",
  showArea = true,
  className = "",
  showTooltip = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    data: SparklineDataPoint;
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    // SVGをクリア
    d3.select(svgRef.current).selectAll("*").remove();

    // SVG要素を作成
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // スケールを作成（マージンなし）
    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => d.value) || 0,
        d3.max(data, (d) => d.value) || 0,
      ])
      .nice()
      .range([height - 2, 2]); // 上下に少しマージン

    // ラインジェネレーターを作成
    const line = d3
      .line<SparklineDataPoint>()
      .x((d, i) => xScale(i))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // エリアジェネレーターを作成
    const area = d3
      .area<SparklineDataPoint>()
      .x((d, i) => xScale(i))
      .y0(height)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // エリアを描画（オプション）
    if (showArea) {
      svg
        .append("path")
        .datum(data)
        .attr("fill", color)
        .attr("fill-opacity", 0.1)
        .attr("d", area);
    }

    // パスを描画
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // 最後のポイントを強調
    const lastPoint = data[data.length - 1];
    svg
      .append("circle")
      .attr("cx", xScale(data.length - 1))
      .attr("cy", yScale(lastPoint.value))
      .attr("r", 2)
      .attr("fill", color);

    // ツールチップ用のオーバーレイ
    if (showTooltip) {
      // マウスイベント用の透明なレイヤー
      const overlay = svg
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "transparent")
        .style("cursor", "crosshair");

      // ホバー時のポイントを表示するための円
      const hoverCircle = svg
        .append("circle")
        .attr("r", 3)
        .attr("fill", color)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("opacity", 0);

      overlay
        .on("mousemove", function (event) {
          const [mx] = d3.pointer(event);

          // 最も近いデータポイントを見つける
          const index = Math.round(xScale.invert(mx));
          const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
          const hoveredData = data[clampedIndex];

          // ホバーポイントを表示
          hoverCircle
            .attr("cx", xScale(clampedIndex))
            .attr("cy", yScale(hoveredData.value))
            .style("opacity", 1);

          // ツールチップの位置を更新
          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const svgRect = svgRef.current?.getBoundingClientRect();

            if (svgRect) {
              setTooltip({
                x: mx,
                y: yScale(hoveredData.value),
                data: hoveredData,
              });
            }
          }
        })
        .on("mouseleave", function () {
          hoverCircle.style("opacity", 0);
          setTooltip(null);
        });
    }
  }, [data, width, height, color, showArea, showTooltip]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <svg ref={svgRef} className={className} />

      {/* ツールチップ */}
      {showTooltip && tooltip && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 40}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg">
            <div className="font-semibold">{tooltip.data.year.substring(0, 4)}年</div>
            <div>{tooltip.data.value.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};
