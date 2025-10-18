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
      .attr("height", height);

    // マージンを設定
    const margin = { top: 5, right: 5, bottom: 5, left: 5 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // データをソート
    const sortedData = [...data].sort((a, b) => a.year.localeCompare(b.year));

    // スケールを設定
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(sortedData, (d) => d.year) as [string, string])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(sortedData, (d) => d.value) as [number, number])
      .range([innerHeight, 0]);

    // ラインジェネレーター
    const line = d3
      .line<SparklineDataPoint>()
      .x((d) => xScale(d.year) + margin.left)
      .y((d) => yScale(d.value) + margin.top)
      .curve(d3.curveMonotoneX);

    // エリアジェネレーター
    const area = d3
      .area<SparklineDataPoint>()
      .x((d) => xScale(d.year) + margin.left)
      .y0(innerHeight + margin.top)
      .y1((d) => yScale(d.value) + margin.top)
      .curve(d3.curveMonotoneX);

    // エリアを描画（オプション）
    if (showArea) {
      svg
        .append("path")
        .datum(sortedData)
        .attr("fill", color)
        .attr("fill-opacity", 0.1)
        .attr("d", area);
    }

    // ラインを描画
    svg
      .append("path")
      .datum(sortedData)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("d", line);

    // データポイントを描画
    const circles = svg
      .selectAll("circle")
      .data(sortedData)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.year) + margin.left)
      .attr("cy", (d) => yScale(d.value) + margin.top)
      .attr("r", 2)
      .attr("fill", color)
      .attr("opacity", 0.8);

    // ツールチップ機能（オプション）
    if (showTooltip) {
      circles
        .on("mouseover", function (event, d) {
          const [x, y] = d3.pointer(event, containerRef.current);
          setTooltip({ x, y, data: d });
        })
        .on("mouseout", () => {
          setTooltip(null);
        });
    }
  }, [data, width, height, color, showArea, showTooltip]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <svg ref={svgRef} />
      {tooltip && showTooltip && (
        <div
          className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-10"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
          }}
        >
          <div>
            {tooltip.data.year}: {tooltip.data.value.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};
