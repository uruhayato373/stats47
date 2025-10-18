/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface TimeSeriesDataPoint {
  year: string;
  value: number;
  label?: string;
}

export interface MultiSeriesConfig {
  key: string;
  color: string;
}

export interface MultiSeriesDataPoint {
  year: string;
  [key: string]: string | number;
}

export interface D3LineChartProps {
  data: TimeSeriesDataPoint[] | MultiSeriesDataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  xLabel?: string;
  yLabel?: string;
  title?: string;
  colorScheme?: string;
  multiSeries?: MultiSeriesConfig[];
}

export const D3LineChart: React.FC<D3LineChartProps> = ({
  data,
  width = 800,
  height = 400,
  margin = { top: 40, right: 30, bottom: 60, left: 80 },
  xLabel = "年度",
  yLabel = "値",
  title,
  colorScheme = "#4f46e5",
  multiSeries,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    // SVGをクリア
    d3.select(svgRef.current).selectAll("*").remove();

    // 内側の描画エリアのサイズ
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // SVG要素を作成
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto;");

    // グループ要素を追加
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // スケールを作成
    const xScale = d3
      .scalePoint()
      .domain(data.map((d) => d.year))
      .range([0, innerWidth])
      .padding(0.5);

    // Y軸のドメインを計算（マルチシリーズの場合はすべての値を考慮）
    let yMax = 0;
    let yMin = 0;
    if (multiSeries) {
      const allValues: number[] = [];
      (data as MultiSeriesDataPoint[]).forEach((d) => {
        multiSeries.forEach((series) => {
          const value = d[series.key];
          if (typeof value === "number") {
            allValues.push(value);
          }
        });
      });
      yMax = d3.max(allValues) || 0;
      yMin = d3.min(allValues) || 0;
    } else {
      const singleData = data as TimeSeriesDataPoint[];
      yMax = d3.max(singleData, (d) => d.value) || 0;
      yMin = d3.min(singleData, (d) => d.value) || 0;
    }

    const yScale = d3
      .scaleLinear()
      .domain([Math.min(0, yMin), yMax])
      .nice()
      .range([innerHeight, 0]);

    // 軸を作成
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => {
      const num = d.valueOf();
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
      }
      return d.toString();
    });

    // X軸を描画
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em");

    // Y軸を描画
    g.append("g").attr("class", "y-axis").call(yAxis);

    // グリッド線を追加
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      );

    // マルチシリーズの場合
    if (multiSeries) {
      const multiData = data as MultiSeriesDataPoint[];

      multiSeries.forEach((series) => {
        // 各シリーズのラインを描画
        const line = d3
          .line<MultiSeriesDataPoint>()
          .defined((d) => typeof d[series.key] === "number")
          .x((d) => xScale(d.year) || 0)
          .y((d) => yScale(d[series.key] as number))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(multiData)
          .attr("class", `line-${series.key}`)
          .attr("fill", "none")
          .attr("stroke", series.color)
          .attr("stroke-width", 2.5)
          .attr("d", line);

        // 各シリーズのデータポイントを描画
        g.selectAll(`.dot-${series.key}`)
          .data(multiData.filter((d) => typeof d[series.key] === "number"))
          .enter()
          .append("circle")
          .attr("class", `dot-${series.key}`)
          .attr("cx", (d) => xScale(d.year) || 0)
          .attr("cy", (d) => yScale(d[series.key] as number))
          .attr("r", 4)
          .attr("fill", series.color)
          .attr("stroke", "white")
          .attr("stroke-width", 2)
          .style("cursor", "pointer")
          .on("mouseenter", function (event, d) {
            d3.select(this).attr("r", 6);

            const tooltip = g
              .append("g")
              .attr("class", "tooltip")
              .attr(
                "transform",
                `translate(${xScale(d.year)},${yScale(
                  d[series.key] as number
                )})`
              );

            const value = d[series.key] as number;
            tooltip
              .append("rect")
              .attr("x", 10)
              .attr("y", -30)
              .attr("width", 150)
              .attr("height", 60)
              .attr("fill", "white")
              .attr("stroke", "#ccc")
              .attr("rx", 4);

            tooltip
              .append("text")
              .attr("x", 20)
              .attr("y", -10)
              .text(`${d.year.substring(0, 4)}年`)
              .style("font-size", "12px")
              .style("font-weight", "bold");

            tooltip
              .append("text")
              .attr("x", 20)
              .attr("y", 10)
              .text(series.key)
              .style("font-size", "11px")
              .style("fill", series.color);

            tooltip
              .append("text")
              .attr("x", 20)
              .attr("y", 30)
              .text(`${value.toLocaleString()}`)
              .style("font-size", "12px");
          })
          .on("mouseleave", function () {
            d3.select(this).attr("r", 4);
            g.selectAll(".tooltip").remove();
          });
      });
    } else {
      // シングルシリーズの場合（既存のコード）
      const singleData = data as TimeSeriesDataPoint[];

      const line = d3
        .line<TimeSeriesDataPoint>()
        .x((d) => xScale(d.year) || 0)
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(singleData)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", colorScheme)
        .attr("stroke-width", 2.5)
        .attr("d", line);

      g.selectAll(".dot")
        .data(singleData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.year) || 0)
        .attr("cy", (d) => yScale(d.value))
        .attr("r", 4)
        .attr("fill", colorScheme)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseenter", function (event, d) {
          d3.select(this).attr("r", 6);

          const tooltip = g
            .append("g")
            .attr("class", "tooltip")
            .attr(
              "transform",
              `translate(${xScale(d.year)},${yScale(d.value)})`
            );

          tooltip
            .append("rect")
            .attr("x", 10)
            .attr("y", -30)
            .attr("width", 120)
            .attr("height", 50)
            .attr("fill", "white")
            .attr("stroke", "#ccc")
            .attr("rx", 4);

          tooltip
            .append("text")
            .attr("x", 20)
            .attr("y", -10)
            .text(`${d.year.substring(0, 4)}年`)
            .style("font-size", "12px")
            .style("font-weight", "bold");

          tooltip
            .append("text")
            .attr("x", 20)
            .attr("y", 10)
            .text(`${d.value.toLocaleString()}`)
            .style("font-size", "12px");
        })
        .on("mouseleave", function () {
          d3.select(this).attr("r", 4);
          g.selectAll(".tooltip").remove();
        });
    }

    // X軸ラベル
    g.append("text")
      .attr("class", "x-label")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 10)
      .text(xLabel)
      .style("font-size", "14px")
      .style("font-weight", "bold");

    // Y軸ラベル
    g.append("text")
      .attr("class", "y-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 20)
      .text(yLabel)
      .style("font-size", "14px")
      .style("font-weight", "bold");

    // タイトル
    if (title) {
      svg
        .append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", 20)
        .text(title)
        .style("font-size", "16px")
        .style("font-weight", "bold");
    }
  }, [
    data,
    width,
    height,
    margin,
    xLabel,
    yLabel,
    title,
    colorScheme,
    multiSeries,
  ]);

  return (
    <div className="w-full">
      <svg ref={svgRef} className="w-full h-auto" />
    </div>
  );
};
