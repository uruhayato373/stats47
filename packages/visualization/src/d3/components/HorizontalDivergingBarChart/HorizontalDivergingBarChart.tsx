"use client";

import { resolveChartDomain } from '@stats47/types';
import { cn } from "@stats47/components";
import { formatValueWithPrecision, resolveValuePrecision } from "@stats47/utils";
import { select, scaleLinear, scaleBand, axisTop } from "d3";
import { useEffect, useRef } from "react";
import { computeChartLayout, computeMarginsByRatio, estimateTextWidth } from "../../../shared/layout";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import { useReadableFontSize } from "../../hooks/useReadableFontSize";
import type { HorizontalDivergingBarChartProps } from "./types";
import { fitSvgViewBox } from "../../utils/fit-svg-viewbox";

/** 等倍表示の文字サイズ (viewBox 単位) */
const BASE_FONT_SIZE = 11;
/** 1 行の高さ (文字サイズに対する比)。帯 (padding 0.25) の中に文字が収まる */
const ROW_HEIGHT_EM = 1.8;

/**
 * HorizontalDivergingBarChart — 基準値からの乖離を水平バーで表示
 *
 * Observable @d3/diverging-bar-chart を参考に、
 * 消費者物価地域差指数（全国平均=100）のような基準値からの乖離を可視化する。
 */
export function HorizontalDivergingBarChart({
  data,
  baseline = 100,
  positiveColor = "#3b82f6",
  negativeColor = "#f97316",
  unit = "",
  width = 500,
  height = 300,
  className,
}: HorizontalDivergingBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  const marginsByRatio = computeMarginsByRatio(width, height, {
    top: 8 / 300,
    right: 50 / 500,
    bottom: 24 / 300,
    left: 100 / 500,
  });

  const layout = computeChartLayout(width, height, {
    marginTop: marginsByRatio.marginTop,
    marginRight: marginsByRatio.marginRight,
    marginBottom: marginsByRatio.marginBottom,
    marginLeft: marginsByRatio.marginLeft,
  });

  // 縮小表示でも画面上で読める文字サイズ (viewBox 単位)。等倍以上なら従来の 11 のまま
  // (2026-11-14 CHART-AXIS-READABILITY-01。375px で 5.9px だった)
  const fontSize = useReadableFontSize(plotRef, width, BASE_FONT_SIZE);
  // 行の高さは文字サイズから決め、足りない分は viewBox を縦に伸ばす (帯の高さで文字を潰さない)
  const innerHeight = Math.max(layout.innerHeight, data.length * fontSize * ROW_HEIGHT_EM);
  // 上の目盛りの文字が上端で切れない余白
  const marginTop = Math.max(layout.marginTop, Math.ceil(fontSize * 1.4));
  const drawHeight = marginTop + innerHeight + layout.marginBottom;
  // 値のラベルはバーの先に出るので、最も長い値の幅だけ左右に余白を取る。項目名は基準線の反対側に出る
  const valueLabelWidth = Math.max(0, ...data.map((item) => estimateTextWidth(item.value.toFixed(1), fontSize))) + 6;
  const marginLeft = Math.max(Math.round(fontSize), valueLabelWidth);
  const marginRight = Math.max(Math.round(fontSize), valueLabelWidth);
  const innerWidth = width - marginLeft - marginRight;
  const values = data.map((item) => item.value);
  const valuePrecision = resolveValuePrecision([...values, baseline]);
  const valueRange =
    values.length > 0
      ? `${formatValueWithPrecision(Math.min(...values), valuePrecision)}から${formatValueWithPrecision(Math.max(...values), valuePrecision)}${unit}`
      : undefined;
  const accessibleLabel = [
    "基準値からの乖離を示す水平棒グラフ",
    `基準値: ${formatValueWithPrecision(baseline, valuePrecision)}${unit}`,
    `項目: ${data.map((item) => item.label).join("、")}`,
    valueRange ? `値の範囲: ${valueRange}` : undefined,
  ]
    .filter(Boolean)
    .join("。");

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    // 乖離度の大きい順にソート
    const sorted = [...data].sort(
      (a, b) => Math.abs(b.value - baseline) - Math.abs(a.value - baseline)
    );

    // X スケール（値軸）
    const values = sorted.map((d) => d.value);
    const domain = resolveChartDomain([...values, baseline], {mode: 'extent', padding: 0.15});
    if (!domain) return;
    // 項目名は基準線の反対側に出るので、基準線の左右それぞれに最も長い項目名が入る幅を残す
    const widestLabel = Math.max(0, ...sorted.map((d) => estimateTextWidth(d.label, fontSize))) + 8;
    const x = scaleLinear()
      .domain(domain)
      .range([0, innerWidth]);
    const baselineX = x(baseline);
    if (baselineX < widestLabel || innerWidth - baselineX < widestLabel) {
      const left = Math.min(Math.max(widestLabel, baselineX), innerWidth - widestLabel);
      // 基準線を項目名が入る位置へずらし、左右それぞれを別の倍率で引き伸ばす
      x.domain([domain[0], baseline, domain[1]]).range([0, left, innerWidth]);
    }

    // Y スケール（カテゴリ軸）
    const y = scaleBand()
      .domain(sorted.map((d) => d.label))
      .range([0, innerHeight])
      .padding(0.25);

    const g = svg
      .append("g")
      .attr("transform", `translate(${marginLeft},${marginTop})`);

    // X 軸（上）
    g.append("g")
      .call(
        axisTop(x)
          .tickSize(-innerHeight)
          .ticks(Math.max(2, Math.floor(innerWidth / (fontSize * 5))))
          .tickFormat((d) => String(d))
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "hsl(var(--border))").attr("stroke-dasharray", "2,2")
      )
      .call((g) =>
        g.selectAll(".tick text").attr("fill", "hsl(var(--muted-foreground))").attr("font-size", fontSize)
      );

    // 基準線（太線）
    g.append("line")
      .attr("x1", x(baseline))
      .attr("x2", x(baseline))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "hsl(var(--foreground))")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.6);

    // バー
    g.selectAll("rect")
      .data(sorted)
      .join("rect")
      .attr("x", (d) => (d.value >= baseline ? x(baseline) : x(d.value)))
      .attr("y", (d) => y(d.label)!)
      .attr("width", (d) => Math.abs(x(d.value) - x(baseline)))
      .attr("height", y.bandwidth())
      .attr("fill", (d) => (d.value >= baseline ? positiveColor : negativeColor))
      .attr("rx", 2)
      .attr("opacity", 0.85)
      .on("mouseenter", function (event, d) {
        select(this).attr("opacity", 1);
        const diff = d.value - baseline;
        const sign = diff >= 0 ? "+" : "";
        showTooltip(event, d.label, {
          value: d.value,
          metricTitle: `全国平均比: ${sign}${diff.toFixed(1)}`,
          unit,
        });
      })
      .on("mousemove", (event) => {
        updateTooltipPosition(event);
      })
      .on("mouseleave", function () {
        select(this).attr("opacity", 0.85);
        hideTooltip();
      });

    // Y軸ラベル（カテゴリ名）
    g.selectAll(".label")
      .data(sorted)
      .join("text")
      .attr("class", "label")
      .attr("x", (d) => (d.value >= baseline ? x(baseline) - 6 : x(baseline) + 6))
      .attr("y", (d) => y(d.label)! + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.value >= baseline ? "end" : "start"))
      .attr("fill", "hsl(var(--foreground))")
      .attr("font-size", fontSize)
      .text((d) => d.label);

    // 値ラベル（バーの端）
    g.selectAll(".value-label")
      .data(sorted)
      .join("text")
      .attr("class", "value-label")
      .attr("x", (d) => (d.value >= baseline ? x(d.value) + 4 : x(d.value) - 4))
      .attr("y", (d) => y(d.label)! + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.value >= baseline ? "start" : "end"))
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("font-size", fontSize)
      .text((d) => d.value.toFixed(1));

    fitSvgViewBox(svgRef.current, width, drawHeight);
  }, [data, baseline, positiveColor, negativeColor, unit, width, drawHeight, fontSize, innerWidth, innerHeight, marginTop, marginLeft, showTooltip, hideTooltip, updateTooltipPosition]);

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center min-h-[200px] text-sm text-muted-foreground", className)}>
        データがありません
      </div>
    );
  }

  return (
    <div ref={plotRef} className={cn("relative", className)}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${drawHeight}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={accessibleLabel}
      />
    </div>
  );
}
