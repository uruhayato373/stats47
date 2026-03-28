"use client";

import { useEffect, useRef, useState } from "react";

import { ToggleGroup, ToggleGroupItem } from "@stats47/components/atoms/ui/toggle-group";
import {
  type RankingValue,
  computeSortedRankings,
} from "@stats47/ranking";
import { useD3Tooltip } from "@stats47/visualization/d3";
import * as d3 from "d3";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";

import type { StatsSchema } from "@stats47/types";

interface RankingAllPrefecturesChartProps {
  rankingValues: (StatsSchema | RankingValue)[];
}

const BAR_HEIGHT = 24;
const TOP_MARGIN = 10;
const BOTTOM_MARGIN = 10;
const LEFT_MARGIN = 80;
const RIGHT_MARGIN = 5;

const BAR_COLOR = "#3b82f6";

export function RankingAllPrefecturesChart({
  rankingValues,
}: RankingAllPrefecturesChartProps) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  const sortedData = computeSortedRankings(rankingValues, { order: sortOrder });

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(width);
    });
    observer.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (sortedData.length === 0 || !svgRef.current || containerWidth <= 0) return;

    const chartHeight =
      sortedData.length * BAR_HEIGHT + TOP_MARGIN + BOTTOM_MARGIN;
    const xMax = d3.max(sortedData, (d) => Number(d.value)) ?? 0;
    const x = d3
      .scaleLinear()
      .domain([0, xMax])
      .range([LEFT_MARGIN, containerWidth - RIGHT_MARGIN]);
    const y = d3
      .scaleBand()
      .domain(sortedData.map((d) => d.areaName))
      .range([TOP_MARGIN, chartHeight - BOTTOM_MARGIN])
      .padding(0.4);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    g.append("g")
      .selectAll("rect")
      .data(sortedData)
      .join("rect")
      .attr("x", LEFT_MARGIN)
      .attr("y", (d) => y(d.areaName) ?? 0)
      .attr("width", (d) => x(Number(d.value)) - LEFT_MARGIN)
      .attr("height", y.bandwidth())
      .attr("fill", BAR_COLOR)
      .style("cursor", "pointer")
      .on("mouseenter", (event, d: StatsSchema | RankingValue) => {
        showTooltip(event as unknown as MouseEvent, d.areaName, {
          value: Number(d.value),
          unit: "unit" in d ? String(d.unit) : undefined,
        });
      })
      .on("mousemove", (event) =>
        updateTooltipPosition(event as unknown as MouseEvent)
      )
      .on("mouseleave", () => hideTooltip());

    const yAxis = d3.axisLeft(y).tickSizeOuter(0);
    g.append("g")
      .attr("transform", `translate(${LEFT_MARGIN},0)`)
      .call(yAxis)
      .call((axis) => axis.select(".domain").remove())
      .selectAll(".tick text")
      .attr("font-size", 12);
  }, [
    sortedData,
    containerWidth,
    showTooltip,
    hideTooltip,
    updateTooltipPosition,
  ]);

  if (sortedData.length === 0) {
    return null;
  }

  const chartHeight =
    sortedData.length * BAR_HEIGHT + TOP_MARGIN + BOTTOM_MARGIN;

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <div className="flex justify-end">
        <ToggleGroup
          type="single"
          value={sortOrder}
          onValueChange={(value) => {
            if (value) setSortOrder(value as "asc" | "desc");
          }}
          className="bg-muted p-1 rounded-md"
        >
          <ToggleGroupItem
            value="desc"
            className="text-xs px-3 py-1.5 flex items-center gap-1.5 data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm rounded-sm transition-all"
            aria-label="降順（高い順）"
          >
            <ArrowDownWideNarrow className="w-4 h-4" />
            <span>高い順</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="asc"
            className="text-xs px-3 py-1.5 flex items-center gap-1.5 data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm rounded-sm transition-all"
            aria-label="昇順（低い順）"
          >
            <ArrowUpNarrowWide className="w-4 h-4" />
            <span>低い順</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div
        ref={containerRef}
        className="w-full flex-1 min-h-0 overflow-y-auto"
      >
        <svg
          ref={svgRef}
          width={containerWidth}
          height={chartHeight}
          className="min-w-full"
          role="img"
          aria-label="全都道府県ランキング棒グラフ"
        />
      </div>
    </div>
  );
}
