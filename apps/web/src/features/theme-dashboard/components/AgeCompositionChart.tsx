"use client";

import { useEffect, useRef } from "react";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

export interface AgeCompositionSeries {
  key: string;
  label: string;
  color: string;
}

export interface AgeCompositionData {
  /** 年度ごとのデータ（category=yearCode, label=yearName, + 各セグメントの値） */
  trendData: Array<Record<string, string | number>>;
  series: AgeCompositionSeries[];
  unit: string;
}

interface AgeCompositionChartProps {
  /** 都道府県データ（null の場合は全国のみ表示） */
  prefData: AgeCompositionData | null;
  /** 全国データ */
  nationalData: AgeCompositionData | null;
  /** 都道府県名 */
  prefName?: string;
  /** ローディング中 */
  loading?: boolean;
}

/**
 * 年齢3区分人口構成 積み上げ棒グラフ（実数・推移のみ）
 *
 * 都道府県選択時: 都道府県 + 全国を上下に並べて比較
 * 未選択時: 全国のみ表示
 */
export function AgeCompositionChart({
  prefData,
  nationalData,
  prefName,
  loading,
}: AgeCompositionChartProps) {
  if (loading) {
    return <Skeleton className="h-[280px] w-full rounded-md" />;
  }

  if (!nationalData && !prefData) {
    return (
      <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
        人口構成データがありません
      </div>
    );
  }

  // 都道府県選択時は都道府県のみ、未選択時は全国のみ
  const displayData = prefData && prefName ? prefData : nationalData;

  if (!displayData) {
    return (
      <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
        人口構成データがありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <StackedBarChart data={displayData} />
      </div>
      {/* 凡例 */}
      {displayData && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {displayData.series.map((s, i) => (
            <div
              key={`${s.key}-${i}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StackedBarChart({ data }: { data: AgeCompositionData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { trendData, series } = data;

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || trendData.length === 0)
      return;
    let cancelled = false;

    import("d3").then((d3) => {
      if (cancelled || !svgRef.current || !containerRef.current) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      // ツールチップ
      const container = d3.select(containerRef.current);
      container.selectAll(".age-tooltip").remove();
      const tooltip = container
        .append("div")
        .attr("class", "age-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("opacity", "0")
        .style("background", "hsl(var(--popover))")
        .style("color", "hsl(var(--popover-foreground))")
        .style("border", "1px solid hsl(var(--border))")
        .style("border-radius", "6px")
        .style("padding", "6px 10px")
        .style("font-size", "11px")
        .style("line-height", "1.5")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.12)")
        .style("z-index", "50")
        .style("white-space", "nowrap");

      const width = 800;
      const height = 300;
      const marginTop = 8;
      const marginRight = 10;
      const marginBottom = 28;
      const marginLeft = 10;

      const keys = series.map((s) => s.key);
      const colorMap = new Map(series.map((s) => [s.key, s.color]));

      const stack = d3
        .stack<Record<string, string | number>>()
        .keys(keys)
        .value((d, key) => Number(d[key]) || 0)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const stackedData = stack(trendData);

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

      const yMax =
        d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1])) ?? 0;
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
        .data((d) =>
          d.map((datum) => ({ ...datum, key: d.key }))
        )
        .join("rect")
        .attr("x", (d) => x(String(d.data.category)) ?? 0)
        .attr("y", (d) => y(d[1]))
        .attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])))
        .attr("width", x.bandwidth())
        .style("cursor", "pointer")
        .on("mouseenter", function (event, d) {
          const yearLabel = d.data.label ?? d.data.category;
          const total = keys.reduce(
            (sum, k) => sum + (Number(d.data[k]) || 0),
            0,
          );
          const lines = series
            .map((s) => {
              const val = Number(d.data[s.key]) || 0;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
              return `<span style="color:${s.color}">■</span> ${s.label}: ${val.toLocaleString()}人 (${pct}%)`;
            })
            .join("<br>");
          tooltip
            .html(
              `<div style="font-weight:600;margin-bottom:2px">${yearLabel}</div>${lines}<br>合計: ${total.toLocaleString()}人`,
            )
            .style("opacity", "1");
        })
        .on("mousemove", function (event) {
          const rect = containerRef.current!.getBoundingClientRect();
          tooltip
            .style("left", `${event.clientX - rect.left + 12}px`)
            .style("top", `${event.clientY - rect.top - 10}px`);
        })
        .on("mouseleave", function () {
          tooltip.style("opacity", "0");
        });

      // X軸
      svg
        .append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(
          d3
            .axisBottom(x)
            .tickValues(filteredTicks.length > 0 ? filteredTicks : catValues)
            .tickFormat((val) => {
              const row = trendData.find((d) => String(d.category) === val);
              return (row?.label ?? val) as string;
            })
            .tickSizeOuter(0),
        )
        .call((g) => g.selectAll(".domain").remove())
        .call((g) => g.selectAll(".tick text").attr("font-size", 13));
    });

    return () => {
      cancelled = true;
      if (containerRef.current) {
        d3Select(containerRef.current).selectAll(".age-tooltip").remove();
      }
    };
  }, [trendData, series]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox="0 0 800 300"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="年齢3区分人口構成推移"
      />
    </div>
  );
}

// cleanup 用に d3.select だけ同期 import
function d3Select(el: Element) {
  // lazy fallback - cleanup 時に d3 がロード済みならそのまま使う
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const d3 = require("d3");
    return d3.select(el);
  } catch {
    return { selectAll: () => ({ remove: () => {} }) };
  }
}
