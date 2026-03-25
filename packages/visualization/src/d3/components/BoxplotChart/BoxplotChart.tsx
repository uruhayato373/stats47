"use client";

import { REGIONS } from "@stats47/area";
import { cn } from "@stats47/components";
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { computeAxisDomain } from "../../../shared";
import { CHART_STYLES } from "../../constants";
import { getThemeColors } from "../../utils/get-theme-colors";
import type { BoxplotChartProps, PrefectureData } from "./types";

const CONFIG = {
  boxWidthRatio: 0.5,
  jitterWidthRatio: 0.6,
  margin: { top: 30, right: 100, bottom: 80, left: 120 },
} as const;

// ------------------------------------------------------------------
// ユーティリティ
// ------------------------------------------------------------------

/** シード付き擬似乱数（ジッター位置を毎レンダリングで固定） */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

/** 数値を日本語ロケールでフォーマット */
function formatNumber(value: number, maxDecimalPlaces?: number): string {
  const isInteger = Math.abs(value - Math.round(value)) < Number.EPSILON * 10;
  if (isInteger) {
    return value.toLocaleString("ja-JP", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  if (maxDecimalPlaces !== undefined) {
    return value.toLocaleString("ja-JP", { minimumFractionDigits: 0, maximumFractionDigits: maxDecimalPlaces });
  }
  const str = String(value);
  const decimalIndex = str.indexOf(".");
  if (decimalIndex !== -1) {
    const trimmedPart = str.slice(decimalIndex + 1).replace(/0+$/, "");
    if (trimmedPart.length > 0) {
      return value.toLocaleString("ja-JP", { minimumFractionDigits: 0, maximumFractionDigits: trimmedPart.length });
    }
  }
  return value.toLocaleString("ja-JP", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ------------------------------------------------------------------
// BoxplotChart コンポーネント
// ------------------------------------------------------------------

/**
 * 地域別（7地方区分）箱ひげ図＋ジッター散布図
 *
 * - 全国データ（areaCode = "00000"）は自動的に除外されます
 * - areaCode は先頭2桁で地方区分に振り分けます（"01001" → "01"）
 */
export function BoxplotChart({
  data,
  decimalPlaces = 0,
  yAxisMin,
  yAxisMax,
  minValueType,
  width = 1200,
  className,
}: BoxplotChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const height = width * 0.5;

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || data.length === 0) return;

    const colors = getThemeColors();
    const TEXT = colors.text;
    const TEXT_MUTED = colors.textMuted;
    const BORDER = colors.border;

    const filteredData = data.filter((d) => d.areaCode !== "00000");

    const scale = width / 1200;
    const margin = {
      top: CONFIG.margin.top * scale,
      right: CONFIG.margin.right * scale,
      bottom: CONFIG.margin.bottom * scale,
      left: CONFIG.margin.left * scale,
    };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    d3.select(svgEl).selectAll("*").remove();

    const svg = d3
      .select(svgEl)
      .style("font-family", "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // データ処理: 地域別グルーピング・統計量計算
    const groupedData = REGIONS.map((region) => {
      const items = filteredData.filter((d) => (region.prefectures as readonly string[]).includes(d.areaCode));
      const values = items.map((d) => d.value).sort(d3.ascending);
      const min = d3.min(values) ?? 0;
      const max = d3.max(values) ?? 0;
      const q1 = d3.quantile(values, 0.25) ?? 0;
      const median = d3.quantile(values, 0.5) ?? 0;
      const q3 = d3.quantile(values, 0.75) ?? 0;
      return { ...region, items, min, max, q1, median, q3 };
    });

    // スケール
    const xScale = d3.scaleBand().domain(groupedData.map((d) => d.regionName)).range([0, chartWidth]).padding(0.2);

    const axisDomain = computeAxisDomain(filteredData.map((d) => d.value), { clampMinToZero: minValueType !== "data-min" });
    const yDomainMin = yAxisMin !== undefined ? yAxisMin : axisDomain.min;
    const yDomainMax = yAxisMax !== undefined ? yAxisMax : axisDomain.max;
    const yScale = d3.scaleLinear().domain([yDomainMin, yDomainMax]).range([chartHeight, 0]);

    // グリッド線
    g.append("g")
      .call(d3.axisLeft(yScale).tickSize(-chartWidth).tickFormat(() => ""))
      .style("stroke", BORDER)
      .style("stroke-opacity", CHART_STYLES.grid.strokeOpacity);

    // 箱ひげ図
    const boxWidth = xScale.bandwidth() * CONFIG.boxWidthRatio;
    const center = xScale.bandwidth() / 2;

    const boxGroup = g
      .selectAll<SVGGElement, (typeof groupedData)[0]>(".box-group")
      .data(groupedData)
      .enter()
      .append("g")
      .attr("class", "box-group")
      .attr("transform", (d) => `translate(${xScale(d.regionName)},0)`);

    // ヒゲ（Min→Q1）
    boxGroup.append("line").attr("x1", center).attr("x2", center)
      .attr("y1", (d) => yScale(d.min)).attr("y2", (d) => yScale(d.q1))
      .attr("stroke", TEXT_MUTED);

    // ヒゲ（Q3→Max）
    boxGroup.append("line").attr("x1", center).attr("x2", center)
      .attr("y1", (d) => yScale(d.q3)).attr("y2", (d) => yScale(d.max))
      .attr("stroke", TEXT_MUTED);

    // ヒゲ端の横棒
    (["min", "max"] as const).forEach((key) => {
      boxGroup.append("line")
        .attr("x1", center - boxWidth / 4).attr("x2", center + boxWidth / 4)
        .attr("y1", (d) => yScale(d[key])).attr("y2", (d) => yScale(d[key]))
        .attr("stroke", TEXT_MUTED);
    });

    // 箱（Q1〜Q3）
    boxGroup.append("rect")
      .attr("x", center - boxWidth / 2).attr("y", (d) => yScale(d.q3))
      .attr("height", (d) => yScale(d.q1) - yScale(d.q3)).attr("width", boxWidth)
      .attr("stroke", TEXT_MUTED).attr("fill", (d) => d.color).attr("fill-opacity", 0.5);

    // 中央値ライン
    boxGroup.append("line")
      .attr("x1", center - boxWidth / 2).attr("x2", center + boxWidth / 2)
      .attr("y1", (d) => yScale(d.median)).attr("y2", (d) => yScale(d.median))
      .attr("stroke", TEXT_MUTED).attr("stroke-width", 2);

    // ジッター散布図＋ラベル
    const rng = seededRandom(42);

    groupedData.forEach((region) => {
      const regionG = g.append("g").attr("transform", `translate(${xScale(region.regionName)},0)`);

      regionG
        .selectAll<SVGCircleElement, PrefectureData>(".dot")
        .data(region.items)
        .enter()
        .append("circle")
        .attr("cx", () => center + (rng() - 0.5) * xScale.bandwidth() * CONFIG.jitterWidthRatio)
        .attr("cy", (d) => yScale(d.value))
        .attr("r", 4 * scale)
        .attr("fill", region.color)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("fill-opacity", 0.9);

      // 最大値ラベル
      const maxItem = region.items.find((d) => d.value === region.max);
      if (maxItem) {
        const labelG = regionG.append("text")
          .attr("x", center).attr("y", yScale(region.max) - 30 * scale)
          .attr("text-anchor", "middle").attr("dominant-baseline", "middle").attr("fill", TEXT);
        labelG.append("tspan").attr("x", center).attr("dy", 0)
          .attr("font-size", `${14 * scale}px`).attr("font-weight", "bold").text(maxItem.areaName);
        const vTspan = labelG.append("tspan").attr("x", center).attr("dy", "1.2em")
          .attr("font-size", `${14 * scale}px`).attr("font-weight", "bold")
          .text(formatNumber(maxItem.value, decimalPlaces));
        if (maxItem.unit) {
          vTspan.append("tspan").attr("font-size", `${11 * scale}px`).attr("font-weight", "normal").text(maxItem.unit);
        }
      }

      // 最小値ラベル
      const minItem = region.items.find((d) => d.value === region.min);
      if (minItem) {
        const labelG = regionG.append("text")
          .attr("x", center).attr("y", yScale(region.min) + 15 * scale)
          .attr("text-anchor", "middle").attr("dominant-baseline", "middle").attr("fill", TEXT);
        labelG.append("tspan").attr("x", center).attr("dy", 0)
          .attr("font-size", `${14 * scale}px`).attr("font-weight", "bold").text(minItem.areaName);
        const vTspan = labelG.append("tspan").attr("x", center).attr("dy", "1.2em")
          .attr("font-size", `${14 * scale}px`).attr("font-weight", "bold")
          .text(formatNumber(minItem.value, decimalPlaces));
        if (minItem.unit) {
          vTspan.append("tspan").attr("font-size", `${11 * scale}px`).attr("font-weight", "normal").text(minItem.unit);
        }
      }
    });

    // X軸
    const xAxis = g.append("g").attr("transform", `translate(0,${chartHeight})`).call(d3.axisBottom(xScale).tickSize(0));
    xAxis.selectAll("text").attr("dy", "1.2em").style("font-size", `${20 * scale}px`).style("font-weight", "bold").style("fill", TEXT_MUTED);
    xAxis.selectAll("line, path").style("stroke", TEXT_MUTED);

    // Y軸
    const yAxis = g.append("g").call(d3.axisLeft(yScale));
    yAxis.selectAll("text").style("font-size", `${14 * scale}px`).style("fill", TEXT_MUTED);
    yAxis.selectAll("line, path").style("stroke", TEXT_MUTED);

  }, [data, decimalPlaces, yAxisMin, yAxisMax, minValueType, width, height]);

  return (
    <div className={cn("w-full", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="地域別箱ひげ図"
        className="w-full h-auto"
      />
    </div>
  );
}
