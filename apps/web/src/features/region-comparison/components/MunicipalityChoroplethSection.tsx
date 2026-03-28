"use client";

import { useEffect, useMemo, useRef } from "react";

import { DashboardCard } from "@/features/stat-charts";

import type { ComparisonRegion } from "../types";
import type { TopoJSONTopology } from "@stats47/types";


/** 東京島嶼部の除外コード */
const TOKYO_ISLAND_CODES = new Set([
  "13000",
  "13361", "13362", "13363", "13364",
  "13381", "13382",
  "13401", "13402",
  "13421",
]);

/** 人口増減率データ */
export interface PopulationRatioEntry {
  areaCode: string;
  areaName: string;
  ratio: number;
}

/** 1都道府県分のマップデータ */
export interface PrefChoroplethData {
  topo: TopoJSONTopology;
  ratios: PopulationRatioEntry[];
}

/** サーバーサイドで取得済みのマップデータ（エリアコードをキーとする） */
export interface ChoroplethMapData {
  [areaCode: string]: PrefChoroplethData;
}

interface Props {
  regions: [ComparisonRegion, ComparisonRegion];
  mapData: ChoroplethMapData;
}

/**
 * 市区町村別人口増減率コロプレスマップ
 *
 * population カテゴリの比較ページにのみ表示。
 * データはサーバーサイドで取得済み。
 */
export function MunicipalityChoroplethSection({ regions, mapData }: Props) {
  const panels = regions.map((region) => {
    const data = mapData[region.areaCode];
    if (!data) return null;
    const excludeCodes = region.areaCode === "13000" ? TOKYO_ISLAND_CODES : new Set<string>();
    return { region, excludeCodes, ...data };
  });

  if (panels.some((p) => p === null)) return null;

  // 全 ratio を集めて共通カラースケールの domain を決定
  const allRatios = Object.values(mapData).flatMap((d) => d.ratios.map((r) => r.ratio));
  const maxAbs = Math.max(
    ...allRatios.map((r) => Math.abs(r - 1))
  );
  const domain: [number, number, number] = [1 - maxAbs, 1, 1 + maxAbs];

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">
        市区町村別 人口増減率（2025→2045）
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {panels.map(
          (panel) =>
            panel && (
              <DashboardCard
                key={panel.region.areaCode}
                title={panel.region.areaName}
                accentColor={panel.region.color}
                source="国立社会保障・人口問題研究所「日本の地域別将来推計人口（令和5年推計）」"
              >
                <PrefectureChoropleth
                  topology={panel.topo}
                  ratios={panel.ratios}
                  excludeCodes={panel.excludeCodes}
                  domain={domain}
                />
                <ChoroplethLegend domain={domain} />
              </DashboardCard>
            )
        )}
      </div>
    </section>
  );
}

// ─── 単一都道府県マップ ────────────────────────────────

const SVG_WIDTH = 640;
const SVG_HEIGHT = 360;
const PADDING = 20;

function PrefectureChoropleth({
  topology,
  ratios,
  excludeCodes,
  domain,
}: {
  topology: TopoJSONTopology;
  ratios: PopulationRatioEntry[];
  excludeCodes: Set<string>;
  domain: [number, number, number];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // ratio lookup
  const ratioMap = useMemo(
    () => new Map(ratios.map((r) => [r.areaCode, r])),
    [ratios]
  );

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current) return;
    let cancelled = false;

    async function draw() {
      const [d3, topojsonClient] = await Promise.all([
        import("d3"),
        import("topojson-client"),
      ]);
      if (cancelled || !svgRef.current || !tooltipRef.current) return;

      const svg = d3.select(svgRef.current);
      const tooltip = d3.select(tooltipRef.current);
      svg.selectAll("*").remove();

      // TopoJSON → GeoJSON
      // topojson-client の Topology 型と @stats47/types の TopoJSONTopology は構造互換だが型定義が異なるためキャスト
      const topoAny = topology as Parameters<typeof topojsonClient.feature>[0];
      const objectKey = Object.keys(topology.objects)[0];
      const geojson = topojsonClient.feature(
        topoAny,
        topoAny.objects[objectKey]
      ) as GeoJSON.FeatureCollection;

      // 除外コードをフィルタ
      const features = geojson.features.filter(
        (f) => !excludeCodes.has((f.properties as Record<string, string>)?.N03_007)
      );

      // Projection: fitExtent で自動フィット
      const filteredCollection: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
      const projection = d3.geoMercator().fitExtent(
        [
          [PADDING, PADDING],
          [SVG_WIDTH - PADDING, SVG_HEIGHT - PADDING],
        ],
        filteredCollection
      );
      const pathGen = d3.geoPath().projection(projection);

      // Diverging color scale (RdBu: 赤=減少, 青=増加)
      const colorScale = d3
        .scaleDiverging<string>(d3.interpolateRdBu)
        .domain([domain[2], domain[1], domain[0]]);
      // RdBu: 赤が左（小さい値=増加側を反転）→ domain を逆順にして
      // 減少=赤, 増加=青 にする

      type MlitFeature = GeoJSON.Feature<GeoJSON.Geometry, { N03_004?: string; N03_007: string }>;

      svg
        .selectAll("path")
        .data(features as MlitFeature[])
        .enter()
        .append("path")
        .attr("d", (d) => pathGen(d) ?? "")
        .attr("fill", (d) => {
          const code = d.properties.N03_007;
          const entry = ratioMap.get(code);
          return entry ? colorScale(entry.ratio) : "#e5e7eb";
        })
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 0.5)
        .on("mouseenter", function (event: MouseEvent, d) {
          const code = d.properties.N03_007;
          const entry = ratioMap.get(code);
          const name = entry?.areaName ?? d.properties.N03_004 ?? "";
          if (!entry) {
            tooltip.style("opacity", "0");
            return;
          }
          const pct = (entry.ratio - 1) * 100;
          const sign = pct >= 0 ? "+" : "";
          tooltip
            .html(`<span style="font-weight:600">${String(name).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] ?? c)}</span><br/>${sign}${pct.toFixed(1)}%`)
            .style("opacity", "1");
          d3.select(this).attr("stroke", "#1e293b").attr("stroke-width", 1.5);
        })
        .on("mousemove", function (event: MouseEvent) {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          tooltip
            .style("left", `${event.clientX - rect.left + 12}px`)
            .style("top", `${event.clientY - rect.top - 8}px`);
        })
        .on("mouseleave", function () {
          tooltip.style("opacity", "0");
          d3.select(this).attr("stroke", "#94a3b8").attr("stroke-width", 0.5);
        });
    }

    draw();
    return () => {
      cancelled = true;
    };
  }, [topology, ratioMap, excludeCodes, domain]);

  return (
    <div ref={containerRef} className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="市区町村別人口増減率マップ"
      />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-10 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground shadow-sm transition-opacity duration-150"
        style={{ opacity: 0 }}
      />
    </div>
  );
}

// ─── 共通レジェンド ──────────────────────────────────

function ChoroplethLegend({
  domain,
}: {
  domain: [number, number, number];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;

    async function draw() {
      const d3 = await import("d3");
      if (cancelled || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      const colorScale = d3
        .scaleDiverging<string>(d3.interpolateRdBu)
        .domain([domain[2], domain[1], domain[0]]);

      for (let x = 0; x < w; x++) {
        const t = x / (w - 1);
        const val = domain[0] + t * (domain[2] - domain[0]);
        ctx.fillStyle = colorScale(val);
        ctx.fillRect(x, 0, 1, h);
      }
    }

    draw();
    return () => {
      cancelled = true;
    };
  }, [domain]);

  const minPct = ((domain[0] - 1) * 100).toFixed(0);
  const maxPct =
    (domain[2] - 1) >= 0
      ? `+${((domain[2] - 1) * 100).toFixed(0)}`
      : ((domain[2] - 1) * 100).toFixed(0);

  return (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-1">
      <canvas
        ref={canvasRef}
        width={200}
        height={12}
        className="w-full rounded"
        style={{ maxWidth: 200 }}
        role="img"
        aria-label="人口増減率カラーレジェンド"
      />
      <div
        className="flex w-full justify-between text-[10px] text-muted-foreground"
        style={{ maxWidth: 200 }}
      >
        <span>{minPct}%</span>
        <span>±0%</span>
        <span>{maxPct}%</span>
      </div>
    </div>
  );
}
