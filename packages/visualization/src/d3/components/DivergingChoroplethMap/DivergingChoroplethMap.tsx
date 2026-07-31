"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { DEFAULT_DIVERGING_SCHEME } from "@stats47/types";
import { geoMercator, geoPath } from "d3-geo";
import { scaleDiverging } from "d3-scale";
import { feature } from "topojson-client";

import {
  legendGradientCss,
  resolveSchemeInterpolator,
} from "../../utils/color-scale/legend-gradient";

import type { Feature, FeatureCollection } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

export interface DivergingChoroplethValue {
  name: string;
  ratio: number; // 1.0 = no change; <1 → red (decrease); >1 → blue (increase)
}

export interface DivergingChoroplethMapProjection {
  mode: "fitExtent";
  padding?: number;
  viewBoxW: number;
  viewBoxH: number;
}

export interface DivergingChoroplethMapFixedProjection {
  mode: "fixed";
  center: [number, number];
  scale: number;
  viewBoxW: number;
  viewBoxH: number;
}

export interface DivergingChoroplethMapProps {
  topology: Topology;
  /** ratio-keyed by areaCode. ratio < 1 = decrease (red), ratio > 1 = increase (blue) */
  valueByCode: Map<string, DivergingChoroplethValue>;
  /** TopoJSON feature property for the area code */
  codeProp?: string;
  /** TopoJSON feature property for the area name */
  nameProp?: string;
  /** Half-width of the color domain: domain = [1-clamp, 1, 1+clamp] */
  colorClamp: number;
  /**
   * 配色 (正典形 / 短縮形どちらも可)。既定は発散配色 interpolateRdBu。
   * ★凡例のグラデーションも同じ値から導出されるので、ここを変えれば凡例も追従する
   *   (以前は 5 色の CSS リテラルが 2 ファイルに複製されていて追従しなかった)。
   */
  colorScheme?: string;
  projection:
    | DivergingChoroplethMapProjection
    | DivergingChoroplethMapFixedProjection;
  excludeCodes?: Set<string>;
  /** Format ratio for tooltip display. Default: "+X.XX%/年" */
  valueFormatter?: (ratio: number) => string;
  showLegend?: boolean;
  ariaLabel: string;
}

interface HoverState {
  code: string;
  name: string;
  ratio: number;
  x: number;
  y: number;
  containerWidth: number;
}

function defaultValueFormatter(ratio: number): string {
  const pct = (ratio - 1) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

export function DivergingChoroplethMap({
  topology,
  valueByCode,
  codeProp = "N03_007",
  nameProp = "N03_001",
  colorClamp,
  colorScheme = DEFAULT_DIVERGING_SCHEME,
  projection: projectionConfig,
  excludeCodes,
  valueFormatter = defaultValueFormatter,
  showLegend = true,
  ariaLabel,
}: DivergingChoroplethMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  const { viewBoxW, viewBoxH } = projectionConfig;

  const projectedPaths = useMemo(() => {
    const objectName = Object.keys(topology.objects)[0];
    const geojson = feature(
      topology,
      topology.objects[objectName] as GeometryCollection,
    ) as FeatureCollection;

    const allFeatures = geojson.features.filter(
      (f) =>
        !excludeCodes ||
        !excludeCodes.has((f.properties?.[codeProp] ?? "") as string),
    );

    let proj: ReturnType<typeof geoMercator>;
    if (projectionConfig.mode === "fitExtent") {
      const padding = projectionConfig.padding ?? 20;
      const fc: FeatureCollection = {
        type: "FeatureCollection",
        features: allFeatures,
      };
      proj = geoMercator().fitExtent(
        [
          [padding, padding],
          [viewBoxW - padding, viewBoxH - padding],
        ],
        fc,
      );
    } else {
      proj = geoMercator()
        .center(projectionConfig.center)
        .scale(projectionConfig.scale)
        .translate([viewBoxW / 2, viewBoxH / 2]);
    }

    const pathGen = geoPath().projection(proj);
    return allFeatures.map((feat: Feature) => ({
      code: (feat.properties?.[codeProp] ?? "") as string,
      name: (feat.properties?.[nameProp] ?? "") as string,
      path: pathGen(feat) ?? "",
    }));
  }, [topology, projectionConfig, excludeCodes, codeProp, nameProp, viewBoxW, viewBoxH]);

  const colorScale = useMemo(
    () =>
      scaleDiverging(resolveSchemeInterpolator(colorScheme))
        .domain([1 - colorClamp, 1, 1 + colorClamp])
        .clamp(true),
    [colorClamp, colorScheme],
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, code: string, name: string, ratio: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setHover({
        code,
        name,
        ratio,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        containerWidth: rect.width,
      });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, code: string) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setHover((h) =>
        h && h.code === code
          ? {
              ...h,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
              containerWidth: rect.width,
            }
          : h,
      );
    },
    [],
  );

  const handleMouseLeave = useCallback(() => setHover(null), []);

  return (
    <div className="space-y-2">
      <div className="relative" ref={containerRef}>
        <svg
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          className="w-full h-auto"
          role="img"
          aria-label={ariaLabel}
        >
          {projectedPaths.map((p) => {
            const entry = valueByCode.get(p.code);
            const fill = entry
              ? colorScale(entry.ratio)
              : "hsl(var(--muted))";
            const isHovered = hover?.code === p.code;
            const displayName = entry?.name ?? p.name;
            const ratio = entry?.ratio;
            return (
              <path
                key={p.code || p.path}
                d={p.path}
                fill={fill}
                stroke={
                  isHovered
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--border))"
                }
                strokeWidth={isHovered ? 1.5 : 0.5}
                strokeLinejoin="round"
                onMouseEnter={
                  ratio !== undefined
                    ? (e) => handleMouseEnter(e, p.code, displayName, ratio)
                    : undefined
                }
                onMouseMove={
                  ratio !== undefined
                    ? (e) => handleMouseMove(e, p.code)
                    : undefined
                }
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-md"
            style={{
              left: Math.min(hover.x + 12, hover.containerWidth - 140),
              top: Math.max(hover.y - 36, 0),
            }}
          >
            <div className="font-bold text-foreground">{hover.name}</div>
            <div
              className={`tabular-nums ${
                hover.ratio >= 1 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {valueFormatter(hover.ratio)}
            </div>
          </div>
        )}
      </div>

      {showLegend && (
        <div className="flex items-center gap-2 text-xs justify-center">
          <span className="font-medium text-red-600">← 減少</span>
          <div
            className="h-2 w-32 rounded-sm"
            style={{ background: legendGradientCss(colorScheme, { reverse: true }) }}
          />
          <span className="font-medium text-blue-600">増加 →</span>
          <span className="text-muted-foreground">
            ±{(colorClamp * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
