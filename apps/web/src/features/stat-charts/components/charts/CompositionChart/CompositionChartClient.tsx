"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@stats47/components";

import type { CompositionChartData } from "../../../adapters/toCompositionChartData";

interface CompositionChartClientProps {
  chartData: CompositionChartData;
}

export const CompositionChartClient: React.FC<CompositionChartClientProps> = ({
  chartData,
}) => {
  const [activeTab, setActiveTab] = useState<"composition" | "trend">(
    "composition",
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "composition" | "trend")}
    >
      <TabsList className="mb-3">
        <TabsTrigger value="composition">構成比</TabsTrigger>
        <TabsTrigger value="trend">推移</TabsTrigger>
      </TabsList>
      <TabsContent value="composition">
        <HorizontalBar chartData={chartData} />
      </TabsContent>
      <TabsContent value="trend">
        <VerticalStacked chartData={chartData} />
      </TabsContent>
    </Tabs>
  );
};

// ---------------------------------------------------------------------------
// 横 100% 積み上げ棒グラフ（最新年の構成比）
// ---------------------------------------------------------------------------

function HorizontalBar({ chartData }: { chartData: CompositionChartData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { trendData, series, unit, latestYearLabel } = chartData;

  const latest =
    trendData.length > 0 ? trendData[trendData.length - 1] : null;

  useEffect(() => {
    if (!svgRef.current || !latest) return;
    let cancelled = false;

    import("d3").then((d3) => {
      if (cancelled || !svgRef.current) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const width = 800;
      const barHeight = 36;
      const marginLeft = 10;
      const marginRight = 10;
      const marginTop = 4;
      const innerWidth = width - marginLeft - marginRight;

      // 値の合計を計算
      const total = series.reduce(
        (sum, s) => sum + (Number(latest[s.key]) || 0),
        0,
      );
      if (total === 0) return;

      // 累積位置を計算
      let cumX = marginLeft;
      const segments = series.map((s) => {
        const value = Number(latest[s.key]) || 0;
        const pct = (value / total) * 100;
        const segWidth = (value / total) * innerWidth;
        const seg = { ...s, value, pct, x: cumX, width: segWidth };
        cumX += segWidth;
        return seg;
      });

      const g = svg.append("g").attr("transform", `translate(0,${marginTop})`);

      // 棒を描画
      g.selectAll("rect")
        .data(segments)
        .join("rect")
        .attr("x", (d) => d.x)
        .attr("y", 0)
        .attr("width", (d) => Math.max(0, d.width))
        .attr("height", barHeight)
        .attr("fill", (d) => d.color)
        .attr("rx", (_, i) => (i === 0 ? 4 : 0))
        .attr("ry", (_, i) => (i === 0 ? 4 : 0));

      // 最後の要素に角丸を追加
      if (segments.length > 1) {
        const last = segments[segments.length - 1];
        g.append("rect")
          .attr("x", last.x + last.width - 4)
          .attr("y", 0)
          .attr("width", 4)
          .attr("height", barHeight)
          .attr("fill", last.color)
          .attr("rx", 4)
          .attr("ry", 4);
      }

      // セグメント内に %ラベル（幅が十分な場合のみ）
      g.selectAll<SVGTextElement, (typeof segments)[0]>("text.pct")
        .data(segments.filter((d) => d.width > 40))
        .join("text")
        .attr("class", "pct")
        .attr("x", (d) => d.x + d.width / 2)
        .attr("y", barHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", 11)
        .attr("font-weight", 600)
        .text((d) => `${d.pct.toFixed(1)}%`);
    });

    return () => { cancelled = true; };
  }, [latest, series]);

  if (!latest) return null;

  const total = series.reduce(
    (sum, s) => sum + (Number(latest[s.key]) || 0),
    0,
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-muted-foreground">{latestYearLabel}</div>
      <svg
        ref={svgRef}
        viewBox="0 0 800 44"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="構成比チャート"
      />
      <div className="grid grid-cols-2 @sm:grid-cols-3 gap-x-4 gap-y-1.5">
        {series.map((s, i) => {
          const value = Number(latest[s.key]) || 0;
          const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={`${s.key}-${i}`} className="flex items-center gap-1.5 text-xs">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-muted-foreground truncate">{s.label}</span>
              <span className="ml-auto tabular-nums font-medium">
                {value.toLocaleString()}
                {unit ? ` ${unit}` : ""}
              </span>
              <span className="text-muted-foreground tabular-nums">
                ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 縦積み上げ棒グラフ（年次推移）
// ---------------------------------------------------------------------------

function VerticalStacked({
  chartData,
}: {
  chartData: CompositionChartData;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { trendData, series, unit } = chartData;

  useEffect(() => {
    if (!svgRef.current || trendData.length === 0) return;
    let cancelled = false;

    import("d3").then((d3) => {
      if (cancelled || !svgRef.current) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const width = 800;
      const height = 280;
      const marginTop = 10;
      const marginRight = 10;
      const marginBottom = 30;
      const marginLeft = 50;

      const keys = series.map((s) => s.key);
      const colorMap = new Map(series.map((s) => [s.key, s.color]));

      const stack = d3
        .stack<Record<string, string | number>>()
        .keys(keys)
        .value((d, key) => Number(d[key]) || 0)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const stackedData = stack(trendData);

      // 5年ごとにフィルタ
      const catValues = trendData.map((d) => String(d.category));
      const filteredTicks = catValues.filter((val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num % 5 === 0;
      });

      const x = d3
        .scaleBand()
        .domain(catValues)
        .range([marginLeft, width - marginRight])
        .padding(0.15);

      const yMax = d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1])) ?? 0;
      const y = d3
        .scaleLinear()
        .domain([0, yMax])
        .nice()
        .range([height - marginBottom, marginTop]);

      // 棒を描画
      svg
        .append("g")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        .attr("fill", (d) => colorMap.get(d.key) ?? "#888")
        .selectAll("rect")
        .data((d) => d)
        .join("rect")
        .attr("x", (d) => x(String(d.data.category)) ?? 0)
        .attr("y", (d) => y(d[1]))
        .attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])))
        .attr("width", x.bandwidth());

      // X軸
      const xAxis = d3
        .axisBottom(x)
        .tickValues(filteredTicks.length > 0 ? filteredTicks : catValues)
        .tickFormat((val) => {
          const row = trendData.find((d) => String(d.category) === val);
          return (row?.label ?? val) as string;
        })
        .tickSizeOuter(0);

      svg
        .append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
        .call((g) => g.selectAll(".domain").remove())
        .call((g) => g.selectAll(".tick text").attr("font-size", 11));

      // Y軸
      const yAxis = d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((v) => Number(v).toLocaleString());

      svg
        .append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .call((g) => g.selectAll(".domain").remove())
        .call((g) => g.selectAll(".tick text").attr("font-size", 11))
        .call((g) =>
          g
            .selectAll(".tick line")
            .clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1),
        );
    });

    return () => { cancelled = true; };
  }, [trendData, series, unit]);

  return (
    <div className="flex flex-col gap-2">
      <svg
        ref={svgRef}
        viewBox="0 0 800 280"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="構成比推移チャート"
      />
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1">
        {series.map((s, i) => (
          <div
            key={`${s.key}-${i}`}
            className="flex items-center gap-1.5 text-xs @[400px]:text-sm text-muted-foreground"
          >
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
