"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { cn } from "@stats47/components";
import { computeChartLayout, computeFontSize, computeMarginsByRatio } from "../../../shared/layout";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { ChartDataNode } from "../../types/base";
import type { BarChartProps } from "./types";

/**
 * BarChart - 横型の棒グラフ（単一系列 or 積み上げ）
 *
 * @see https://observablehq.com/@d3/horizontal-bar-chart/2（単一系列）
 * @see https://observablehq.com/@d3/stacked-horizontal-bar-chart/2（積み上げ）
 */
export function BarChart({
    data,
    keys,
    valueKey = "value",
    indexBy = "name",
    width = 800,
    height = 500,
    marginTop: propsMarginTop,
    marginRight: propsMarginRight,
    marginBottom: propsMarginBottom,
    marginLeft: propsMarginLeft,
    xLabel,
    yLabel,
    colors = d3.schemeTableau10,
    valueFormat = (d) => d.toLocaleString(),
    unit = "",
    title,
    isLoading = false,
    className,
    showLegend = false,
    xDomain: xDomainProp,
    mode = "stacked",
}: BarChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

    // --- レイアウト計算 ---
    const margins = computeMarginsByRatio(width, height, {
        top: 30 / 500,     // 0.06
        right: 30 / 800,   // 0.0375
        bottom: 30 / 500,  // 0.06
        left: 100 / 800,   // 0.125
    });

    const layout = computeChartLayout(width, height, {
        marginTop: propsMarginTop ?? margins.marginTop,
        marginRight: propsMarginRight ?? margins.marginRight,
        marginBottom: propsMarginBottom ?? margins.marginBottom,
        marginLeft: propsMarginLeft ?? margins.marginLeft,
    });

    const { innerWidth, innerHeight, marginTop, marginLeft, marginRight, marginBottom } = layout;
    const baseFontSize = computeFontSize(width, height, 0.02); // 12 / 600 or 16 / 800 = 0.02

    const hasKeys = keys && keys.length > 0;

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const y0 = d3.scaleBand()
            .domain(data.map(d => String(d[indexBy])))
            .range([marginTop, height - marginBottom])
            .padding(0.1);

        const g = svg.append("g");

        if (hasKeys && keys && mode === "grouped") {
            // --- グループ棒グラフ（並列表示）---
            const y1 = d3.scaleBand()
                .domain(keys)
                .range([0, y0.bandwidth()])
                .padding(0.05);

            const computedMax = d3.max(data, d => d3.max(keys, k => Number(d[k]) || 0)) ?? 0;
            const x = d3.scaleLinear()
                .domain(xDomainProp ?? [0, computedMax])
                .range([marginLeft, width - marginRight]);
            const color = d3.scaleOrdinal<string>().domain(keys).range(colors);

            const xAxis = d3.axisTop(x)
                .ticks(innerWidth / 80)
                .tickFormat(d => valueFormat(d as number));
            const yAxis = d3.axisLeft(y0).tickSizeOuter(0);

            g.append("g")
                .selectAll("g")
                .data(data)
                .join("g")
                .attr("transform", d => `translate(0,${y0(String(d[indexBy]))})`)
                .selectAll("rect")
                .data(d => keys.map(k => ({ key: k, value: Number(d[k]) || 0, category: String(d[indexBy]) })))
                .join("rect")
                .attr("x", marginLeft)
                .attr("y", d => y1(d.key)!)
                .attr("width", d => Math.max(0, x(d.value) - marginLeft))
                .attr("height", y1.bandwidth())
                .attr("fill", d => color(d.key))
                .attr("class", "transition-opacity duration-200 hover:opacity-80")
                .style("cursor", "pointer")
                .on("mouseenter", (event, d) => {
                    showTooltip(event, d.category, {
                        value: d.value,
                        unit,
                        categoryName: d.key,
                    });
                })
                .on("mousemove", (event) => updateTooltipPosition(event))
                .on("mouseleave", () => hideTooltip());

            g.append("g")
                .attr("transform", `translate(0,${marginTop})`)
                .call(xAxis)
                .call(axis => axis.select(".domain").remove())
                .call(axis => axis.selectAll(".tick text").attr("font-size", baseFontSize))
                .call(axis => axis.append("text")
                    .attr("x", width - marginRight)
                    .attr("y", -10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "end")
                    .attr("font-weight", "bold")
                    .attr("font-size", baseFontSize)
                    .text(xLabel || ""));

            g.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(yAxis)
                .call(axis => axis.select(".domain").remove())
                .call(axis => axis.selectAll(".tick text").attr("font-size", baseFontSize));

        } else if (hasKeys && keys) {
            // --- 積み上げ棒グラフ ---
            const series = d3.stack<ChartDataNode>().keys(keys)(data);
            const computedMax = d3.max(series, d => d3.max(d, d => d[1])) ?? 0;
            const x = d3.scaleLinear()
                .domain(xDomainProp ?? [0, computedMax])
                .range([marginLeft, width - marginRight]);
            const color = d3.scaleOrdinal<string>().domain(keys).range(colors);

            const xAxis = d3.axisTop(x)
                .ticks(innerWidth / 80)
                .tickFormat(d => valueFormat(d as number));
            const yAxis = d3.axisLeft(y0).tickSizeOuter(0);

            g.append("g")
                .selectAll("g")
                .data(series)
                .join("g")
                .attr("fill", d => color(d.key))
                .selectAll("rect")
                .data(d => d.map(v => Object.assign(v, { key: d.key })))
                .join("rect")
                .attr("x", d => x(d[0]))
                .attr("y", d => y0(d.data[indexBy] as string)!)
                .attr("width", d => x(d[1]) - x(d[0]))
                .attr("height", y0.bandwidth())
                .attr("class", "transition-opacity duration-200 hover:opacity-80")
                .style("cursor", "pointer")
                .on("mouseenter", (event, d: { data: ChartDataNode; key: string; 0: number; 1: number }) => {
                    showTooltip(event, d.data[indexBy] as string, {
                        value: d[1] - d[0],
                        unit,
                        categoryName: d.key,
                    });
                })
                .on("mousemove", (event) => updateTooltipPosition(event))
                .on("mouseleave", () => hideTooltip());

            g.append("g")
                .attr("transform", `translate(0,${marginTop})`)
                .call(xAxis)
                .call(axis => axis.select(".domain").remove())
                .call(axis => axis.selectAll(".tick text").attr("font-size", baseFontSize))
                .call(axis => axis.append("text")
                    .attr("x", width - marginRight)
                    .attr("y", -10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "end")
                    .attr("font-weight", "bold")
                    .attr("font-size", baseFontSize)
                    .text(xLabel || ""));

            g.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(yAxis)
                .call(axis => axis.select(".domain").remove())
                .call(axis => axis.selectAll(".tick text").attr("font-size", baseFontSize))
                .call(axis => axis.append("text")
                    .attr("x", -marginLeft)
                    .attr("y", marginTop - 10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .attr("font-weight", "bold")
                    .attr("font-size", baseFontSize)
                    .text(yLabel || ""));

            // Legend is rendered as HTML below the SVG
        } else {
            // --- 単一系列の横棒グラフ（Observable Horizontal Bar Chart パターン） ---
            const xMax = d3.max(data, d => Number(d[valueKey])) ?? 0;
            const x = d3.scaleLinear()
                .domain(xDomainProp ?? [0, xMax])
                .range([marginLeft, width - marginRight]);
            const barColor = (colors[0] as string) ?? "#888";

            const xAxis = d3.axisTop(x)
                .ticks(innerWidth / 80)
                .tickFormat(d => valueFormat(d as number));
            const yAxis = d3.axisLeft(y0).tickSizeOuter(0);

            g.append("g")
                .selectAll("rect")
                .data(data)
                .join("rect")
                .attr("x", marginLeft)
                .attr("y", d => y0(String(d[indexBy]))!)
                .attr("width", d => x(Number(d[valueKey])) - marginLeft)
                .attr("height", y0.bandwidth())
                .attr("fill", barColor)
                .attr("class", "transition-opacity duration-200 hover:opacity-80")
                .style("cursor", "pointer")
                .on("mouseenter", (event, d: ChartDataNode) => {
                    showTooltip(event, String(d[indexBy]), {
                        value: Number(d[valueKey]),
                        unit,
                        categoryName: "",
                    });
                })
                .on("mousemove", (event) => updateTooltipPosition(event))
                .on("mouseleave", () => hideTooltip());

            g.append("g")
                .attr("transform", `translate(0,${marginTop})`)
                .call(xAxis)
                .call(axis => axis.select(".domain").remove())
                .call(axis => axis.selectAll(".tick text").attr("font-size", baseFontSize))
                .call(axis => axis.append("text")
                    .attr("x", width - marginRight)
                    .attr("y", -10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "end")
                    .attr("font-weight", "bold")
                    .attr("font-size", baseFontSize)
                    .text(xLabel || ""));

            g.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(yAxis)
                .call(axis => axis.select(".domain").remove())
                .call(axis => axis.selectAll(".tick text").attr("font-size", baseFontSize))
                .call(axis => axis.append("text")
                    .attr("x", -marginLeft)
                    .attr("y", marginTop - 10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .attr("font-weight", "bold")
                    .attr("font-size", baseFontSize)
                    .text(yLabel || ""));
        }
    }, [data, keys, valueKey, indexBy, width, height, marginTop, marginRight, marginBottom, marginLeft, xLabel, yLabel, colors, valueFormat, unit, showTooltip, hideTooltip, updateTooltipPosition, innerWidth, baseFontSize, hasKeys, showLegend, xDomainProp, mode]);

    return (
        <div className={cn("relative flex flex-col w-full", className)}>
            {title && <h3 className="text-lg font-semibold mb-4 self-start">{title}</h3>}
            <div className="relative w-full overflow-hidden">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto"
                />
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                )}
            </div>
            {showLegend && hasKeys && keys && keys.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1">
                    {keys.map((key, i) => (
                        <div key={key} className="flex items-center gap-1.5 text-xs @[400px]:text-sm text-muted-foreground">
                            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: (colors[i % colors.length] as string) ?? "#888" }} />
                            <span>{key}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
