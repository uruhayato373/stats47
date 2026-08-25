"use client";

import { cn } from "@stats47/components";
import { schemeTableau10, select, scalePoint, scaleLinear, line, axisBottom, axisLeft, axisRight, pointer } from "d3";
import { useEffect, useRef } from "react";
import {
  computeChartLayout,
  computeFontSize,
  computeMarginsByRatio,
} from "../../../shared/layout";
import { CHART_STYLES, compactAxisFormat } from "../../constants";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import { D3ChartLegend } from "../shared/D3ChartLegend";
import type { D3LineChartProps, TimeSeriesDataNode } from "./types";

const DEFAULT_COLORS = schemeTableau10 as readonly string[];

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
  yAxisFormatter = compactAxisFormat,
  tooltipFormatter = defaultFormat,
  yDomain: yDomainProp,
  rightUnit,
}: D3LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showStackedTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  const marginsByRatio = computeMarginsByRatio(width, height, CHART_STYLES.margin.timeSeries);

  /**
   * 右軸を描くか。**描画とマージンで同じ判定を使う** —
   * 別々に導出すると「マージンは広げていないのに軸は描く」状態が起きて
   * 目盛ラベルが viewBox の外に出て切れる。
   */
  const hasRightAxis = !!seriesConfig?.some((s) => s.yAxis === "right");
  const RIGHT_AXIS_MARGIN = 48;

  const layout = computeChartLayout(width, height, {
    marginTop: propsMarginTop ?? marginsByRatio.marginTop,
    marginRight:
      propsMarginRight ??
      (hasRightAxis
        ? Math.max(marginsByRatio.marginRight, RIGHT_AXIS_MARGIN)
        : marginsByRatio.marginRight),
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
  const legendItems = legendSeries.map((s) => ({
    key: s.dataKey,
    label: s.name,
    color: s.color,
    marker: "line" as const,
  }));
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
    title ? `折れ線グラフ「${title}」` : "折れ線グラフ",
    `系列: ${legendSeries.map((item) => item.name).join("、")}`,
    categoryRange ? `期間: ${categoryRange}` : undefined,
    unit ? `左軸単位: ${unit}` : undefined,
    hasRightAxis && rightUnit ? `右軸単位: ${rightUnit}` : undefined,
  ]
    .filter(Boolean)
    .join("。");

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const catValues = data.map((d) => String(d[categoryKey] ?? ""));
    const x = scalePoint()
      .domain(catValues)
      .range([marginLeft, width - marginRight]);

    const isMulti = !!(seriesConfig && seriesConfig.length > 0);
    const seriesToDraw = isMulti
      ? seriesConfig!
      : [{ dataKey: valueKey, name: valueKey, color: colors[0] ?? "#888" }];

    // 軸ごとにドメインを分ける。右軸系列が 1 本も無ければ右軸は作らない
    // (= yAxis 未指定の既存チャートは従来と完全に同じ経路を通る)。
    const rightSeries = seriesToDraw.filter((s) => s.yAxis === "right");
    const leftSeries = seriesToDraw.filter((s) => s.yAxis !== "right");

    const domainOf = (keys: string[]): [number, number] => {
      const values = data.flatMap((d) =>
        keys.map((k) => d[k]).filter((v): v is number => typeof v === "number"),
      );
      const min = values.length ? Math.min(...values) : 0;
      const max = values.length ? Math.max(...values) : 0;
      return [Math.min(0, min), max];
    };

    const y = scaleLinear()
      .domain(yDomainProp ?? domainOf(leftSeries.map((s) => s.dataKey)))
      .nice()
      .range([height - marginBottom, marginTop]);

    // yDomainProp は左軸専用 (右軸は常に自動スケール)
    const yRight = hasRightAxis
      ? scaleLinear()
          .domain(domainOf(rightSeries.map((s) => s.dataKey)))
          .nice()
          .range([height - marginBottom, marginTop])
      : null;

    /** 系列が載る軸のスケール。右軸が無い場合は常に左。 */
    const scaleFor = (s: { yAxis?: "left" | "right" }) =>
      s.yAxis === "right" && yRight ? yRight : y;

    const lineFn = line<TimeSeriesDataNode>().x((d) => x(String(d[categoryKey])) ?? 0);

    seriesToDraw.forEach((s) => {
      const filtered = data.filter((d) => d[s.dataKey] != null);
      const scale = scaleFor(s);
      const pathLine = lineFn.y((d) => scale(Number(d[s.dataKey])));
      svg
        .append("path")
        .datum(filtered)
        .attr("fill", "none")
        .attr("stroke", s.color)
        .attr("stroke-width", 1.5)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        // 破線指定が無ければ属性自体を付けない (null で D3 が属性を削除する)
        .attr("stroke-dasharray", s.strokeDasharray ?? null)
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

    const xAxis = axisBottom(x)
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

    const yAxis = axisLeft(y)
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

    // --- 右Y軸 (右軸系列があるときだけ) ---
    if (yRight) {
      const rightAxisColor = rightSeries[0]?.color ?? "currentColor";
      svg
        .append("g")
        .attr("transform", `translate(${width - marginRight},0)`)
        .call(
          axisRight(yRight)
            .ticks(innerHeight / 40)
            .tickFormat((v) => yAxisFormatter(Number(v))),
        )
        .call((g) => g.selectAll(".domain").remove())
        // 右軸は grid 線を引かない (左軸の grid と重なって読みづらくなる)
        .call((g) => g.selectAll(".tick line").remove())
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("font-size", baseFontSize)
            .attr("fill", rightAxisColor)
            .attr("dx", "4"),
        );

      // 軸頭の単位ラベル。左右で単位が違うことを読み手に示す
      if (rightUnit) {
        svg
          .append("text")
          .attr("x", width - marginRight)
          .attr("y", marginTop - 8)
          .attr("text-anchor", "end")
          .attr("font-size", baseFontSize)
          .attr("fill", rightAxisColor)
          .text(rightUnit);
      }
      if (unit) {
        svg
          .append("text")
          .attr("x", marginLeft)
          .attr("y", marginTop - 8)
          .attr("text-anchor", "start")
          .attr("font-size", baseFontSize)
          .attr("fill", leftSeries[0]?.color ?? "currentColor")
          .text(unit);
      }
    }

    // データポイント（静的表示用）
    const pointRadius = 3;
    seriesToDraw.forEach((s) => {
      // 比較系列は点を描かない (主系列の点と混ざって読みづらくなるため)
      if (s.hidePoints) return;
      const filtered = data.filter((d) => d[s.dataKey] != null);
      const scale = scaleFor(s);
      svg
        .append("g")
        .selectAll("circle")
        .data(filtered)
        .join("circle")
        .attr("cx", (d) => x(String(d[categoryKey])) ?? 0)
        .attr("cy", (d) => scale(Number(d[s.dataKey])))
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
        const [mouseX] = pointer(event);

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
            return v != null ? scaleFor(s)(Number(v)) : -100;
          })
          .attr("opacity", (s) => (closestData[s.dataKey] != null ? 1 : 0));

        // スタックツールチップ。
        // 2 軸のときは系列ごとに単位が違うので、共通 unit ではなく系列名に単位を併記する
        // (共通 unit を出すと右軸系列に左軸の単位が付いて誤読させる)。
        const label =
          (closestData.label as string) ?? closestCat;
        const items = seriesToDraw.map((s) => {
          const seriesUnit = s.yAxis === "right" ? rightUnit : unit;
          return {
            name: yRight && seriesUnit ? `${s.name} (${seriesUnit})` : s.name,
            value: closestData[s.dataKey] != null ? Number(closestData[s.dataKey]) : null,
            color: s.color,
          };
        });
        showStackedTooltip(event, label, items, {
          // 2 軸のときは系列名側に単位を出したので、共通 unit は付けない
          unit: yRight ? "" : unit,
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
    rightUnit,
    yAxisFormatter,
    tooltipFormatter,
    showStackedTooltip,
    hideTooltip,
    yDomainProp,
    hasRightAxis,
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
      {showLegend && <D3ChartLegend items={legendItems} />}
      <div className="relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          overflow="hidden"
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
