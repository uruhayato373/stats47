"use client";

import { cn } from "@stats47/components";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { computeFontSize } from "../../../shared/layout";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { HierarchyDataNode } from "../../types/base";
import type { SunburstChartProps } from "./types";

/**
 * D3の階層ノードを拡張した型（Sunburstのアニメーション用）
 */
interface SunburstHierarchyNode extends d3.HierarchyRectangularNode<HierarchyDataNode> {
    current?: SunburstHierarchyNode;
    target?: SunburstHierarchyNode;
}

/**
 * ObservableのSunburstを基にしたズーム可能なサンバーストチャート
 * @see https://observablehq.com/@d3/zoomable-sunburst
 */
export function SunburstChart({
    data,
    width = 600,
    height = 600,
    unit = "",
    onNodeClick,
    isLoading = false,
}: SunburstChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const radius = width / 6;
    const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

    useEffect(() => {
        if (!svgRef.current || !data) return;

        // SVGの初期化
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // 階層データの作成
        const root = d3.hierarchy(data)
            .sum(d => d.value ?? 0)
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

        const hierarchy = d3.partition<HierarchyDataNode>()
            .size([2 * Math.PI, root.height + 1])(root) as SunburstHierarchyNode;

        // currentプロパティの初期化（描画前に必須）
        hierarchy.each((d: SunburstHierarchyNode) => {
            d.current = d;
        });

        // D3のカラースキーム
        const color = d3.scaleOrdinal(
            d3.quantize(d3.interpolateRainbow, data.children?.length ? data.children.length + 1 : 11)
        );

        // アークジェネレータ
        const arc = d3.arc<SunburstHierarchyNode>()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius * 1.5)
            .innerRadius(d => d.y0 * radius)
            .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

        // メイングループ
        const g = svg.append("g")
            .attr("transform", `translate(${width / 2},${width / 2})`);

        // セグメント（Path）の描画
        const path = g.append("g")
            .selectAll("path")
            .data(hierarchy.descendants().slice(1)) // ルートは除外（中心にするため）
            .join("path")
            .attr("fill", d => {
                let node = d as SunburstHierarchyNode;
                while (node.depth > 1) node = node.parent as SunburstHierarchyNode;
                return color(node.data.name);
            })
            .attr("fill-opacity", d => {
                const node = d as SunburstHierarchyNode;
                return arcVisible(node.current!) ? (node.children ? 0.6 : 0.4) : 0;
            })
            .attr("pointer-events", d => {
                const node = d as SunburstHierarchyNode;
                return arcVisible(node.current!) ? "auto" : "none";
            })
            .attr("d", d => arc((d as SunburstHierarchyNode).current!));

        // クリック時の挙動
        path.filter(d => !!d.children)
            .style("cursor", "pointer")
            .on("click", (event, p) => {
                clicked(event, p as SunburstHierarchyNode);
                if (onNodeClick) onNodeClick(p.data);
            });

        // ツールチップ
        path
            .on("mouseenter", (event, d) => {
                const breadcrumb = d.ancestors().map(d => d.data.name).reverse().join(" / ");
                showTooltip(event, breadcrumb, {
                    value: d.value ?? null,
                    unit,
                });
            })
            .on("mousemove", (event) => updateTooltipPosition(event))
            .on("mouseleave", () => hideTooltip());

        // ラベルの描画
        const label = g.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none")
            .selectAll("text")
            .data(hierarchy.descendants().slice(1))
            .join("text")
            .attr("dy", "0.35em")
            .attr("fill-opacity", d => +labelVisible((d as SunburstHierarchyNode).current!))
            .attr("transform", d => labelTransform((d as SunburstHierarchyNode).current!))
            .text(d => d.data.name)
            .style("font-size", `${computeFontSize(width, height, 0.017)}px`)
            .style("fill", "#333");

        // 中心（ルート）ボタン
        const parent = g.append("circle")
            .datum(hierarchy)
            .attr("r", radius)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("click", (event: any, p: any) => clicked(event, p as SunburstHierarchyNode));

        // ズーム（クリック）処理
        function clicked(event: any, p: SunburstHierarchyNode) {
            parent.datum(p.parent || hierarchy);

            hierarchy.each((d: SunburstHierarchyNode) => {
                d.target = {
                    x0: Math.max(0, Math.min(1, (d.x0 - (p.x0 ?? 0)) / ((p.x1 ?? 1) - (p.x0 ?? 0)))) * 2 * Math.PI,
                    x1: Math.max(0, Math.min(1, (d.x1 - (p.x0 ?? 0)) / ((p.x1 ?? 1) - (p.x0 ?? 0)))) * 2 * Math.PI,
                    y0: Math.max(0, d.y0 - (p.depth ?? 0)),
                    y1: Math.max(0, d.y1 - (p.depth ?? 0))
                } as SunburstHierarchyNode;
            });

            const t = g.transition().duration(750) as any;

            path.transition(t)
                .tween("data", (d: any) => {
                    const i = d3.interpolate(d.current, d.target);
                    return (t: number) => d.current = i(t);
                })
                .filter(function (d: any) {
                    return !!+d3.select(this).attr("fill-opacity") || arcVisible(d.target);
                })
                .attr("fill-opacity", (d: any) => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
                .attr("pointer-events", (d: any) => arcVisible(d.target) ? "auto" : "none")
                .attrTween("d", (d: any) => () => arc(d.current) || "");

            label.filter(function (d: any) {
                return !!+d3.select(this).attr("fill-opacity") || labelVisible(d.target);
            }).transition(t)
                .attr("fill-opacity", (d: any) => +labelVisible(d.target))
                .attrTween("transform", (d: any) => () => labelTransform(d.current));
        }

        // 可視性判定ユーティリティ
        function arcVisible(d: SunburstHierarchyNode) {
            return (d.y1 ?? 0) <= 3 && (d.y0 ?? 0) >= 1 && (d.x1 ?? 0) > (d.x0 ?? 0);
        }

        function labelVisible(d: SunburstHierarchyNode) {
            return (d.y1 ?? 0) <= 3 && (d.y0 ?? 0) >= 1 && ((d.y1 ?? 0) - (d.y0 ?? 0)) * ((d.x1 ?? 0) - (d.x0 ?? 0)) > 0.03;
        }

        function labelTransform(d: SunburstHierarchyNode) {
            const x = (((d.x0 ?? 0) + (d.x1 ?? 0)) / 2) * 180 / Math.PI;
            const y = (((d.y0 ?? 0) + (d.y1 ?? 0)) / 2) * radius;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        }

    }, [data, width, height, unit, onNodeClick, radius, showTooltip, hideTooltip, updateTooltipPosition]);

    return (
        <div
            className={cn(
                "relative flex items-center justify-center w-full",
                isLoading && "opacity-50 pointer-events-none"
            )}
            ref={containerRef}
        >
            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto"
                style={{ maxWidth: "100%" }}
            />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}
        </div>
    );
}
