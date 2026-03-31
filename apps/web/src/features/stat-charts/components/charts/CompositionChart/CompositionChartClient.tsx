"use client";

import { useState, useEffect, useRef } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@stats47/components";

import type { CompositionChartData } from "../../../adapters/toCompositionChartData";

interface CompositionChartClientProps {
  chartData: CompositionChartData;
  defaultTab?: "composition" | "trend";
}

export const CompositionChartClient: React.FC<CompositionChartClientProps> = ({
  chartData,
  defaultTab = "composition",
}) => {
  const [activeTab, setActiveTab] = useState<"composition" | "trend">(
    defaultTab,
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "composition" | "trend")}
    >
      <div className="flex items-center justify-between mb-3">
        <TabsList className="h-7 p-0.5">
          <TabsTrigger value="composition" className="text-xs h-6 px-2.5">構成比</TabsTrigger>
          <TabsTrigger value="trend" className="text-xs h-6 px-2.5">推移</TabsTrigger>
        </TabsList>
        {activeTab === "composition" && chartData.latestYearLabel && (
          <span className="text-xs text-muted-foreground">{chartData.latestYearLabel}</span>
        )}
      </div>
      <TabsContent value="composition" className="mt-0">
        <DonutChart chartData={chartData} />
      </TabsContent>
      <TabsContent value="trend" className="mt-0">
        <VerticalStacked chartData={chartData} />
      </TabsContent>
    </Tabs>
  );
};

// ---------------------------------------------------------------------------
// ドーナツチャート（最新年の構成比）
// ---------------------------------------------------------------------------

function DonutChart({ chartData }: { chartData: CompositionChartData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { trendData, series, unit } = chartData;

  const latest =
    trendData.length > 0 ? trendData[trendData.length - 1] : null;

  const filteredSeries = series.filter((s) => s.label !== "その他");

  const total = latest
    ? filteredSeries.reduce((sum, s) => sum + (Number(latest[s.key]) || 0), 0)
    : 0;

  useEffect(() => {
    if (!svgRef.current || !latest || total === 0) return;
    let cancelled = false;

    import("d3").then((d3) => {
      if (cancelled || !svgRef.current) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const size = 200;
      const outerRadius = size / 2;
      const innerRadius = outerRadius * 0.6;

      const pieData = filteredSeries.map((s) => ({
        ...s,
        value: Number(latest[s.key]) || 0,
        pct: total > 0 ? ((Number(latest[s.key]) || 0) / total * 100).toFixed(1) : "0.0",
      }));

      const pie = d3
        .pie<(typeof pieData)[0]>()
        .value((d) => d.value)
        .sort(null)
        .padAngle(0.02);

      const arc = d3
        .arc<d3.PieArcDatum<(typeof pieData)[0]>>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .cornerRadius(2);

      const g = svg
        .append("g")
        .attr("transform", `translate(${size / 2},${size / 2})`);

      const tooltip = tooltipRef.current;

      g.selectAll("path")
        .data(pie(pieData))
        .join("path")
        .attr("d", arc)
        .attr("fill", (d) => d.data.color)
        .attr("cursor", "pointer")
        .on("mouseenter", (event, d) => {
          if (!tooltip) return;
          d3.select(event.currentTarget).attr("opacity", 0.8);
          const unitText = unit ? ` ${unit}` : "";
          tooltip.innerHTML = `<span style="color:${d.data.color}">●</span> ${d.data.label}<br><strong>${d.data.value.toLocaleString()}${unitText}</strong>（${d.data.pct}%）`;
          tooltip.style.opacity = "1";
        })
        .on("mousemove", (event) => {
          if (!tooltip || !svgRef.current) return;
          const rect = svgRef.current.getBoundingClientRect();
          tooltip.style.left = `${event.clientX - rect.left}px`;
          tooltip.style.top = `${event.clientY - rect.top - 40}px`;
        })
        .on("mouseleave", (event) => {
          if (!tooltip) return;
          d3.select(event.currentTarget).attr("opacity", 1);
          tooltip.style.opacity = "0";
        });
    });

    return () => { cancelled = true; };
  }, [latest, filteredSeries, total, unit]);

  if (!latest) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          className="w-40 h-40"
          role="img"
          aria-label="構成比ドーナツチャート"
        />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none rounded bg-popover border border-border px-2 py-1 text-xs shadow-sm whitespace-nowrap transition-opacity duration-150"
          style={{ opacity: 0 }}
        />
      </div>
      <div className="w-full border-t pt-2">
        <ul className="divide-y divide-border">
          {filteredSeries.map((s, i) => {
            const value = Number(latest[s.key]) || 0;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return (
              <li key={`${s.key}-${i}`} className="flex items-center gap-2 py-1.5 text-sm">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-foreground/80">{s.label}</span>
                <span className="ml-auto tabular-nums font-semibold">
                  {value.toLocaleString()}
                  {unit ? <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span> : null}
                </span>
                <span className="text-muted-foreground tabular-nums w-14 text-right">
                  {pct}%
                </span>
              </li>
            );
          })}
        </ul>
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
  const { trendData, series, unit, latestYearLabel } = chartData;

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

  const latest = trendData.length > 0 ? trendData[trendData.length - 1] : null;
  const total = latest
    ? series.reduce((sum, s) => sum + (Number(latest[s.key]) || 0), 0)
    : 0;

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
      {latest && (
        <div className="mt-3 pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1.5">{latestYearLabel}</div>
          <ul className="divide-y divide-border">
            {series
              .filter((s) => s.label !== "その他")
              .map((s, i) => {
                const value = Number(latest[s.key]) || 0;
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                return (
                  <li key={`${s.key}-${i}`} className="flex items-center gap-2 py-1.5 text-sm">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-foreground/80">{s.label}</span>
                    <span className="ml-auto tabular-nums font-semibold">
                      {value.toLocaleString()}
                      {unit ? <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span> : null}
                    </span>
                    <span className="text-muted-foreground tabular-nums w-14 text-right">
                      {pct}%
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
}
