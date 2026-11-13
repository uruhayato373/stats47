"use client";

import { resolveChartDomain } from '@stats47/types';

import { cn } from "@stats47/components";
import {
  schemeTableau10,
  select,
  scaleBand,
  scaleLinear,
  line,
  axisBottom,
  axisLeft,
  axisRight,
} from "d3";
import { useEffect, useRef } from "react";
import {
  axisUnitBaseline,
  bottomMarginForTickLabels,
  computeChartLayout,
  computeFontSize,
  computeMarginsByRatio,
  fitCategoryAxis,
  leftMarginForTickLabels,
  rightMarginForTickLabels,
  topMarginForAxisUnit,
  xTickLabelDy,
  yTickCount,
} from "../../../shared/layout";
import { CHART_STYLES, compactAxisFormat } from "../../constants";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import { useReadableFontSize } from "../../hooks/useReadableFontSize";
import { D3ChartLegend } from "../shared/D3ChartLegend";
import type { MixedChartProps } from "./types";
import { fitSvgViewBox } from "../../utils/fit-svg-viewbox";

/**
 * MixedChart - 棒グラフ（左Y軸）+ 折れ線グラフ（右Y軸）の2軸チャート
 */
export function MixedChart({
  data,
  leftYDomain,
  rightYDomain,
  categoryKey = "category",
  columns,
  lines,
  width = 800,
  height = 500,
  marginTop: propsMarginTop,
  marginRight: propsMarginRight,
  marginBottom: propsMarginBottom,
  marginLeft: propsMarginLeft,
  leftUnit = "",
  rightUnit = "",
  leftAxisFormatter = compactAxisFormat,
  rightAxisFormatter = compactAxisFormat,
  unit = "",
  colors = schemeTableau10,
  isLoading = false,
  className,
  title,
}: MixedChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  const marginsByRatio = computeMarginsByRatio(width, height, CHART_STYLES.margin.dualAxis);

  const layout = computeChartLayout(width, height, {
    marginTop: propsMarginTop ?? marginsByRatio.marginTop,
    marginRight: propsMarginRight ?? marginsByRatio.marginRight,
    marginBottom: propsMarginBottom ?? marginsByRatio.marginBottom,
    marginLeft: propsMarginLeft ?? marginsByRatio.marginLeft,
  });

  const { innerWidth, innerHeight, marginLeft, marginRight } = layout;
  // 縮小表示でも画面上で読める文字サイズ (viewBox 単位)。等倍以上なら従来の大きさのまま
  const baseFontSize = useReadableFontSize(
    plotRef,
    width,
    computeFontSize(width, height, CHART_STYLES.font.sizeRatio),
  );
  const leftAxisUnit = leftUnit || unit;
  const rightAxisUnit = rightUnit || unit;
  // 文字を大きくした分だけ上下の余白を足し、その分 viewBox を縦に伸ばす (プロット領域の高さは変えない)
  const marginTop =
    leftAxisUnit || rightAxisUnit ? topMarginForAxisUnit(baseFontSize, layout.marginTop) : layout.marginTop;
  const marginBottom = bottomMarginForTickLabels(baseFontSize, layout.marginBottom);
  const drawHeight = height + (marginTop - layout.marginTop) + (marginBottom - layout.marginBottom);

  const allSeries = [...columns, ...lines];
  const legendItems = [
    ...columns.map((s) => ({
      key: s.dataKey,
      label: s.name,
      color: s.color,
      marker: "square" as const,
      opacity: 0.8,
    })),
    ...lines.map((s) => ({
      key: s.dataKey,
      label: s.name,
      color: s.color,
      marker: "line" as const,
    })),
  ];
  const categoryLabels = data
    .map((row) => String(row.label ?? row[categoryKey] ?? ""))
    .filter(Boolean);
  const firstCategory = categoryLabels[0];
  const lastCategory = categoryLabels[categoryLabels.length - 1];
  const categoryRange = firstCategory
    ? firstCategory === lastCategory
      ? firstCategory
      : `${firstCategory}から${lastCategory}`
    : undefined;
  const accessibleLabel = [
    title ? `棒・折れ線複合グラフ「${title}」` : "棒・折れ線複合グラフ",
    columns.length > 0
      ? `棒系列: ${columns.map((item) => item.name).join("、")}`
      : undefined,
    lines.length > 0
      ? `折れ線系列: ${lines.map((item) => item.name).join("、")}`
      : undefined,
    categoryRange ? `期間: ${categoryRange}` : undefined,
    leftUnit || unit ? `左軸単位: ${leftUnit || unit}` : undefined,
    rightUnit || unit ? `右軸単位: ${rightUnit || unit}` : undefined,
  ]
    .filter(Boolean)
    .join("。");

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const catValues = data.map((d) => String(d[categoryKey] ?? ""));

    // 左Y軸: 棒グラフ用
    const colKeys = columns.map((c) => c.dataKey);
    const colValues = data.flatMap((d) =>
      colKeys.map((k) => d[k]).filter((v): v is number => typeof v === "number")
    );
    const leftDomain = resolveChartDomain(colValues, {mode: 'zero'}, leftYDomain);
    if (!leftDomain) return;
    const yLeft = scaleLinear()
      .domain(leftDomain)
      .range([drawHeight - marginBottom, marginTop]);

    // 右Y軸: 折れ線用
    const lineKeys = lines.map((l) => l.dataKey);
    const lineValues = data.flatMap((d) =>
      lineKeys.map((k) => d[k]).filter((v): v is number => typeof v === "number")
    );
    const rightDomain = resolveChartDomain(lineValues, {mode: 'extent'}, rightYDomain);
    if (!rightDomain) return;
    const yRight = scaleLinear()
      .domain(rightDomain)
      .range([drawHeight - marginBottom, marginTop]);




    // 左軸のラベルが左端で切れないよう、目盛りの実際の文字列から左余白を決める
    // (StackedAreaChart / LineChart と同じ。2026-09-25 CHART-AXIS-READABILITY-01)
    const tickCount = yTickCount(innerHeight, baseFontSize);
    const leftTicks = yLeft.ticks(tickCount);
    const axisLeftEdge = leftMarginForTickLabels(
      leftTicks.map((v) => leftAxisFormatter(Number(v))),
      baseFontSize,
      marginLeft,
    );
    // 右軸の目盛りも実際の文字列から右余白を決める (文字を大きくしたときに右端で切れないように)
    const rightTicks = yRight.ticks(tickCount);
    const axisRightEdge =
      width -
      rightMarginForTickLabels(
        rightTicks.map((v) => rightAxisFormatter(Number(v))),
        baseFontSize,
        marginRight,
      );

    // X軸: バンドスケール（棒の幅用）。横軸の目盛りは 5 年ごと。ラベルの幅と位置から、重なる
    // (縮小表示で文字を大きくした) ときは 10 年・20 年と広げ、両端の年ラベルがはみ出すときは描画領域を詰める。
    const scaleForRange = (left: number, right: number) =>
      scaleBand().domain(catValues).range([left, right]).padding(0.2);
    const { plotLeft, plotRight, tickValues } = fitCategoryAxis(
      width,
      axisLeftEdge,
      axisRightEdge,
      baseFontSize,
      (left, right) => {
        const scale = scaleForRange(left, right);
        return data.map((d) => {
          const value = String(d[categoryKey] ?? "");
          return {
            value,
            label: String(d.label ?? value),
            position: (scale(value) ?? 0) + scale.bandwidth() / 2,
            yearCode: d.yearCode,
          };
        });
      },
      { fallback: "none" },
    );
    const x = scaleForRange(plotLeft, plotRight);

    const baseline = Math.max(leftDomain[0], Math.min(0, leftDomain[1]));
    // --- 棒グラフ描画 ---
    const barWidth = x.bandwidth() / Math.max(columns.length, 1);
    columns.forEach((col, colIdx) => {
      svg
        .append("g")
        .selectAll("rect")
        .data(data.filter((d) => d[col.dataKey] != null))
        .join("rect")
        .attr("x", (d) => (x(String(d[categoryKey])) ?? 0) + barWidth * colIdx)
        .attr("y", (d) => Math.min(yLeft(baseline), yLeft(Number(d[col.dataKey]))))
        .attr("width", barWidth)
        .attr("height", (d) => Math.abs(yLeft(baseline) - yLeft(Number(d[col.dataKey]))))
        .attr("fill", col.color)
        .attr("opacity", 0.8)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
          const label = (d.label as string) ?? String(d[categoryKey]);
          showTooltip(event, label, {
            value: Number(d[col.dataKey]),
            metricTitle: col.name,
            unit: leftUnit || unit,
          });
        })
        .on("mousemove", (event) => updateTooltipPosition(event))
        .on("mouseleave", () => hideTooltip());
    });

    // --- 折れ線描画 ---
    const xCenter = (d: Record<string, string | number | undefined>) =>
      (x(String(d[categoryKey])) ?? 0) + x.bandwidth() / 2;

    lines.forEach((s) => {
      const filtered = data.filter((d) => typeof d[s.dataKey] === "number" && Number.isFinite(d[s.dataKey]));

      const lineFn = line<(typeof filtered)[number]>()
        .defined(d => typeof d[s.dataKey] === "number" && Number.isFinite(d[s.dataKey]))
        .x((d) => xCenter(d))
        .y((d) => yRight(Number(d[s.dataKey])));

      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", s.color)
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", lineFn);

      // ドット
      svg
        .append("g")
        .selectAll("circle")
        .data(filtered)
        .join("circle")
        .attr("cx", (d) => xCenter(d))
        .attr("cy", (d) => yRight(Number(d[s.dataKey])))
        .attr("r", 4)
        .attr("fill", s.color)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
          const label = (d.label as string) ?? String(d[categoryKey]);
          showTooltip(event, label, {
            value: Number(d[s.dataKey]),
            metricTitle: s.name,
            unit: rightUnit || unit,
          });
        })
        .on("mousemove", (event) => updateTooltipPosition(event))
        .on("mouseleave", () => hideTooltip());
    });

    // --- X軸 ---
    svg
      .append("g")
      .attr("transform", `translate(0,${drawHeight - marginBottom})`)
      .call(
        axisBottom(x)
          .tickValues(tickValues)
          .tickFormat((val) => {
            const row = data.find((d) => String(d[categoryKey]) === val);
            return (row?.label ?? val) as string;
          })
          .tickSizeOuter(0)
      )
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("dy", xTickLabelDy(baseFontSize)));

    // --- 左Y軸 ---
    svg
      .append("g")
      .attr("transform", `translate(${plotLeft},0)`)
      .call(
        axisLeft(yLeft)
          .tickValues(leftTicks)
          .tickFormat((v) => leftAxisFormatter(Number(v)))
      )
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke-opacity", 0).clone()
          .attr("x2", plotRight - plotLeft)
          .attr("stroke-opacity", CHART_STYLES.grid.strokeOpacity)
          .attr("stroke-dasharray", CHART_STYLES.grid.dashArray)
      )
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("fill", columns[0]?.color ?? "#666").attr("dx", "-4"));

    // --- 右Y軸 ---
    svg
      .append("g")
      .attr("transform", `translate(${plotRight},0)`)
      .call(
        axisRight(yRight)
          .tickValues(rightTicks)
          .tickFormat((v) => rightAxisFormatter(Number(v)))
      )
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize).attr("fill", lines[0]?.color ?? "#666"));

    // --- 軸の頭の単位 (左 = 棒、右 = 折れ線。目盛りと同じ色で左右を見分ける) ---
    if (leftAxisUnit) {
      svg
        .append("text")
        .attr("class", "axis-unit")
        .attr("x", plotLeft)
        .attr("y", axisUnitBaseline(marginTop))
        .attr("text-anchor", "start")
        .attr("font-size", baseFontSize)
        .attr("fill", columns[0]?.color ?? "#666")
        .text(leftAxisUnit);
    }
    if (rightAxisUnit) {
      svg
        .append("text")
        .attr("class", "axis-unit")
        .attr("x", plotRight)
        .attr("y", axisUnitBaseline(marginTop))
        .attr("text-anchor", "end")
        .attr("font-size", baseFontSize)
        .attr("fill", lines[0]?.color ?? "#666")
        .text(rightAxisUnit);
    }

    fitSvgViewBox(svgRef.current, width, drawHeight);
  }, [
    data, leftYDomain, rightYDomain, categoryKey, columns, lines, width, drawHeight,
    marginTop, marginRight, marginBottom, marginLeft,
    baseFontSize, innerHeight, innerWidth, leftUnit, rightUnit, unit, leftAxisUnit, rightAxisUnit,
    leftAxisFormatter, rightAxisFormatter, colors,
    showTooltip, hideTooltip, updateTooltipPosition,
  ]);

  return (
    <div className={cn("relative flex flex-col w-full", className)}>
      {allSeries.length > 1 && (
        <D3ChartLegend items={legendItems} />
      )}
      <div ref={plotRef} className="relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${drawHeight}`}
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
