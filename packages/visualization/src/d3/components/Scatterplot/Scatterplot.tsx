"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { cn } from "@stats47/components";
import { computeChartLayout, computeFontSize, computeMarginsByRatio } from "../../../shared/layout";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { ScatterplotProps } from "./types";

/**
 * Scatterplot - 点の集まりとしてデータを表示する D3 チャート
 * 
 * 2つの変数間の関係を視覚化するために使用されます。
 * 線形、対数、時間軸のスケールをサポートしています。
 * 
 * @see https://observablehq.com/@d3/scatterplot/2
 */
export function Scatterplot({
    data,
    width = 640,
    height = 400,
    xLabel,
    yLabel,
    xType = "linear",
    yType = "linear",
    xDomain,
    yDomain,
    xFormat,
    yFormat,
    grid = true,
    r = 3,
    stroke = "currentColor",
    strokeWidth = 1.5,
    strokeOpacity = 1,
    fill = "none",
    regressionLine,
    className,
    title,
    isLoading = false,
    marginTop: propsMarginTop,
    marginRight: propsMarginRight,
    marginBottom: propsMarginBottom,
    marginLeft: propsMarginLeft,
}: ScatterplotProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

    // --- レイアウト計算 ---
    const marginsByRatio = computeMarginsByRatio(width, height, {
        top: 20 / 400,     // 0.05
        right: 30 / 640,   // 0.046875
        bottom: 30 / 400,  // 0.075
        left: 40 / 640,    // 0.0625
    });

    const layout = computeChartLayout(width, height, {
        marginTop: propsMarginTop ?? marginsByRatio.marginTop,
        marginRight: propsMarginRight ?? marginsByRatio.marginRight,
        marginBottom: propsMarginBottom ?? marginsByRatio.marginBottom,
        marginLeft: propsMarginLeft ?? marginsByRatio.marginLeft,
    });

    const { innerWidth, innerHeight, marginTop, marginLeft, marginRight, marginBottom } = layout;
    const baseFontSize = computeFontSize(width, height, 0.01875); // 12 / 640 = 0.01875

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Compute values.
        const X = data.map((d) => d.x);
        const Y = data.map((d) => d.y);
        const I = d3.range(data.length);

        // Compute default domains.
        let currentXDomain = xDomain;
        let currentYDomain = yDomain;

        if (currentXDomain === undefined) {
            if (xType === "time") {
                currentXDomain = d3.extent(X) as [Date, Date];
            } else {
                currentXDomain = d3.extent(X as number[]) as [number, number];
            }
        }

        if (currentYDomain === undefined) {
            if (yType === "time") {
                currentYDomain = d3.extent(Y) as [Date, Date];
            } else {
                currentYDomain = d3.extent(Y as number[]) as [number, number];
            }
        }

        // Construct scales and axes.
        const xScale = (xType === "log" ? d3.scaleLog() : xType === "time" ? d3.scaleTime() : d3.scaleLinear()) as any;
        xScale.domain(currentXDomain as any)
            .range([marginLeft, width - marginRight]);

        const yScale = (yType === "log" ? d3.scaleLog() : yType === "time" ? d3.scaleTime() : d3.scaleLinear()) as any;
        yScale.domain(currentYDomain as any)
            .range([height - marginBottom, marginTop]);

        const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat);
        const yAxis = d3.axisLeft(yScale).ticks(height / 50, yFormat);

        if (grid) {
            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .attr("class", "grid")
                .style("stroke-opacity", 0.1)
                .call(d3.axisBottom(xScale).ticks(width / 80).tickSize(-height + marginTop + marginBottom).tickFormat(() => ""));

            svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .attr("class", "grid")
                .style("stroke-opacity", 0.1)
                .call(d3.axisLeft(yScale).ticks(height / 50).tickSize(-width + marginLeft + marginRight).tickFormat(() => ""));
        }

        // Add axes.
        svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(xAxis)
            .call((g) => g.select(".domain").remove())
            .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize))
            .call((g) => g.append("text")
                .attr("x", width)
                .attr("y", marginBottom - 4)
                .attr("fill", "currentColor")
                .attr("text-anchor", "end")
                .attr("font-size", baseFontSize)
                .text(xLabel || ""));

        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(yAxis)
            .call((g) => g.select(".domain").remove())
            .call((g) => g.selectAll(".tick text").attr("font-size", baseFontSize))
            .call((g) => g.append("text")
                .attr("x", -marginLeft)
                .attr("y", 10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .attr("font-size", baseFontSize)
                .text(yLabel || ""));

        // Add points.
        svg.append("g")
            .attr("stroke", stroke)
            .attr("stroke-width", strokeWidth)
            .attr("stroke-opacity", strokeOpacity)
            .attr("fill", fill)
            .selectAll("circle")
            .data(I)
            .join("circle")
            .attr("cx", (i) => xScale(X[i] as any))
            .attr("cy", (i) => yScale(Y[i] as any))
            .attr("r", r)
            .style("cursor", "pointer")
            .on("mouseenter", (event, i) => {
                const d = data[i];
                showTooltip(event, d.label || d.category || "Data Point", {
                    value: typeof d.y === "number" ? d.y : null,
                    unit: yLabel,
                    categoryName: d.category,
                });
            })
            .on("mousemove", (event) => {
                updateTooltipPosition(event);
            })
            .on("mouseleave", () => {
                hideTooltip();
            });

        // Draw regression line
        if (regressionLine && xType === "linear" && yType === "linear") {
            const [xMin, xMax] = xScale.domain() as [number, number];
            const y1 = regressionLine.slope * xMin + regressionLine.intercept;
            const y2 = regressionLine.slope * xMax + regressionLine.intercept;

            svg.append("line")
                .attr("x1", xScale(xMin))
                .attr("y1", yScale(y1))
                .attr("x2", xScale(xMax))
                .attr("y2", yScale(y2))
                .attr("stroke", "hsl(0, 70%, 50%)")
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "6,3")
                .attr("opacity", 0.7);
        }

    }, [data, width, height, marginTop, marginRight, marginBottom, marginLeft, innerWidth, innerHeight, baseFontSize, xLabel, yLabel, xType, yType, xDomain, yDomain, xFormat, yFormat, grid, r, stroke, strokeWidth, strokeOpacity, fill, regressionLine, showTooltip, hideTooltip, updateTooltipPosition]);

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
        </div>
    );
}
