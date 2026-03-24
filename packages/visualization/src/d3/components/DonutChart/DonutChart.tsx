"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { cn } from "@stats47/components";
import { computeFontSize } from "../../../shared/layout";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { DonutChartDataNode, DonutChartProps } from "./types";

/**
 * DonutChart - 構成比を円環状に表示する D3 チャート
 * 
 * @see https://observablehq.com/@d3/donut-chart/2
 */
export function DonutChart({
    data,
    width = 600,
    height = 600,
    innerRadius,
    outerRadius,
    labelThreshold = 0.05,
    centerText,
    colors = d3.schemeTableau10,
    title,
    isLoading = false,
    className,
    onNodeClick,
}: DonutChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const margin = 1;
        const effectiveOuterRadius = outerRadius || Math.min(width, height) / 2 - margin;
        const effectiveInnerRadius = innerRadius !== undefined ? innerRadius : effectiveOuterRadius / 2;

        const arc = d3.arc<any>()
            .innerRadius(effectiveInnerRadius)
            .outerRadius(effectiveOuterRadius);

        const pie = d3.pie<DonutChartDataNode>()
            .padAngle(1 / effectiveOuterRadius)
            .sort(null) // オリジナルの並び順を維持
            .value(d => d.value);

        const color = d3.scaleOrdinal(data.map(d => d.name), colors);

        const g = svg.append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        // セグメント（Path）の描画
        g.append("g")
            .selectAll("path")
            .data(pie(data))
            .join("path")
            .attr("fill", d => d.data.color || color(d.data.name))
            .attr("d", arc)
            .attr("class", "transition-all duration-300 hover:opacity-80")
            .style("cursor", "pointer")
            .on("mouseenter", (event, d) => {
                const total = d3.sum(data, d => d.value);
                const percentage = ((d.data.value / total) * 100).toFixed(1);
                showTooltip(event, d.data.name, {
                    value: d.data.value,
                    unit: `${percentage}%`,
                });
            })
            .on("mousemove", (event) => {
                updateTooltipPosition(event);
            })
            .on("mouseleave", () => {
                hideTooltip();
            })
            .on("click", (event, d) => {
                if (onNodeClick) onNodeClick(d.data);
            });

        // ラベルの描画
        const labelArc = d3.arc<any>()
            .innerRadius(effectiveInnerRadius + (effectiveOuterRadius - effectiveInnerRadius) * 0.5)
            .outerRadius(effectiveInnerRadius + (effectiveOuterRadius - effectiveInnerRadius) * 0.5);

        const total = d3.sum(data, d => d.value);

        const baseFontSize = computeFontSize(width, height, 0.02); // 12 / 600 = 0.02

        g.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", baseFontSize)
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(pie(data))
            .join("text")
            .attr("transform", d => `translate(${labelArc.centroid(d)})`)
            .selectAll("tspan")
            .data(d => {
                // 割合が低い場合はラベルを表示しない
                if (d.data.value / total < labelThreshold) return [];
                return [d.data.name, d.data.value.toLocaleString()];
            })
            .join("tspan")
            .attr("x", 0)
            .attr("y", (d, i) => `${i * 1.1}em`)
            .attr("font-weight", (d, i) => (i === 0 ? "bold" : "normal"))
            .text(d => d);

        // 中心テキストがある場合
        if (centerText) {
            g.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .attr("font-size", effectiveInnerRadius * 0.25)
                .attr("font-weight", "bold")
                .attr("fill", "currentColor")
                .text(centerText);
        }

    }, [data, width, height, innerRadius, outerRadius, labelThreshold, centerText, colors, showTooltip, hideTooltip, updateTooltipPosition, onNodeClick]);

    return (
        <div className={cn("relative flex flex-col items-center w-full", className)}>
            {title && <h3 className="text-lg font-semibold mb-4 self-start">{title}</h3>}
            <div className="relative w-full overflow-hidden flex items-center justify-center">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto"
                    style={{ maxWidth: Math.min(width, height) }}
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
