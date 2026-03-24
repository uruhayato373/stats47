"use client";

import { cn } from "@stats47/components";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { HierarchyDataNode } from "../../types/base";
import type { TreemapChartProps } from "./types";

/**
 * D3 Treemap（Observable @d3/treemap スタイル）
 * 階層データを矩形で可視化。子ノードの value で面積を按分。
 */
export function TreemapChart({
  data,
  width = 600,
  height = 400,
  unit = "",
  onNodeClick,
  isLoading = false,
}: TreemapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  useEffect(() => {
    if (!svgRef.current || !data?.children?.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const root = d3
      .hierarchy(data)
      .sum((d) => (d as HierarchyDataNode).value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const treemap = d3
      .treemap<HierarchyDataNode>()
      .size([width, height])
      .paddingOuter(Math.max(1, Math.round(width * 0.005)))
      .paddingInner(Math.max(1, Math.round(width * 0.0017)))
      .round(true);

    treemap(root);

    const color = d3.scaleOrdinal(
      d3.quantize(
        d3.interpolateRainbow,
        data.children?.length ? data.children.length + 1 : 11
      )
    );

    const cell = svg
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", (d) => {
        const node = d as d3.HierarchyRectangularNode<HierarchyDataNode>;
        return `translate(${node.x0},${node.y0})`;
      });

    cell
      .append("rect")
      .attr("width", (d) => {
        const node = d as d3.HierarchyRectangularNode<HierarchyDataNode>;
        return node.x1 - node.x0;
      })
      .attr("height", (d) => {
        const node = d as d3.HierarchyRectangularNode<HierarchyDataNode>;
        return node.y1 - node.y0;
      })
      .attr("fill", (d) => color((d.data as HierarchyDataNode).name))
      .attr("fill-opacity", 0.8)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", onNodeClick ? "pointer" : "default")
      .on("click", (event, d) => {
        if (onNodeClick) onNodeClick(d.data as HierarchyDataNode);
      })
      .on("mouseenter", (event, d) => {
        showTooltip(event, (d.data as HierarchyDataNode).name, {
          value: d.value ?? null,
          unit,
        });
      })
      .on("mousemove", (event) => updateTooltipPosition(event))
      .on("mouseleave", () => hideTooltip());

    const fontSize = (d: d3.HierarchyRectangularNode<HierarchyDataNode>) => {
      const w = d.x1 - d.x0;
      const h = d.y1 - d.y0;
      return Math.min(12, Math.sqrt(w * h) / 8);
    };

    cell
      .filter((d) => {
        const node = d as d3.HierarchyRectangularNode<HierarchyDataNode>;
        const minW = width * 0.066;
        const minH = height * 0.05;
        return node.x1 - node.x0 > minW && node.y1 - node.y0 > minH;
      })
      .append("text")
      .attr("x", (d) => {
        const node = d as d3.HierarchyRectangularNode<HierarchyDataNode>;
        return (node.x1 - node.x0) / 2;
      })
      .attr("y", (d) => {
        const node = d as d3.HierarchyRectangularNode<HierarchyDataNode>;
        return (node.y1 - node.y0) / 2;
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .style("font-size", (d) =>
        `${fontSize(d as d3.HierarchyRectangularNode<HierarchyDataNode>)}px`
      )
      .style("pointer-events", "none")
      .text((d) => (d.data as HierarchyDataNode).name);
  }, [data, width, height, unit, onNodeClick, showTooltip, hideTooltip, updateTooltipPosition]);

  return (
    <div
      className={cn(
        "relative w-full",
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
}
