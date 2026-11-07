"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import { Button } from "@stats47/components/atoms/ui/button";
import { formatValueWithPrecision, resolveValuePrecision } from "@stats47/utils";
import { resolveChoroplethScale, type MapDataPoint, type MapVisualizationConfig } from "@stats47/visualization/d3";
import { select } from "d3-selection";
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior } from "d3-zoom";
import { Minus, Plus } from "lucide-react";

import { GEO_SVG_MAP } from "@/components/charts/geo-topology";

import type { MapShapes } from "./map-shapes";

const MAX_ZOOM = 12;
const ZOOM_STEP = 1.6;
const ZOOM_MS = 200;
/** 形が多い地図は境界線を細くする (全国の市区町村では線が色を隠す) */
const DENSE_MAP_SHAPES = 200;
const THIN_BORDER = 0.15;
const NORMAL_BORDER = 0.5;
const ACTIVE_BORDER = 1.6;
const TOOLTIP_WIDTH = 170;

type Scale = Awaited<ReturnType<typeof resolveChoroplethScale>>;
type Hover = { code: string; x: number; y: number; frameWidth: number };

interface Props extends MapShapes {
  data: MapDataPoint[];
  colorConfig: MapVisualizationConfig;
  unit?: string;
  decimalPlaces?: number;
  borderColor: string;
  selectedCode?: string | null;
  onAreaClick?: (code: string) => void;
}

/**
 * ランキングの SVG の地図。背景タイルも凡例も持たず、濃淡で全体を見せる。値はホバー・タップ先・表で読む。
 * ページのスクロールを奪わないよう、ホイールは Ctrl / ⌘ を押したときだけ、タッチは 2 本指だけでズームし、
 * 拡大中は 1 本指で動かせる。形が多いので、ホバーと選択は別の層に描いて全部の形を描き直さない。
 */
export function RankingSvgMap({ shapes, insetLine, data, colorConfig, unit = "", decimalPlaces, borderColor, selectedCode, onAreaClick }: Props) {
  const [scale, setScale] = useState<Scale | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const layer = useRef<SVGGElement>(null);
  const behavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveChoroplethScale(colorConfig, data).then((resolved) => {
      if (!cancelled) setScale(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [colorConfig, data]);

  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const zoomer = zoom<SVGSVGElement, unknown>()
      // タッチの受け付けを端末の判定に任せず、常に付ける
      .touchable(() => true)
      .scaleExtent([1, MAX_ZOOM])
      .translateExtent([
        [0, 0],
        [GEO_SVG_MAP.width, GEO_SVG_MAP.height],
      ])
      .filter((event: MouseEvent & TouchEvent & WheelEvent) => {
        if (event.type === "wheel") return event.ctrlKey || event.metaKey;
        if (event.type === "touchstart") return event.touches.length > 1 || zoomTransform(element).k > 1;
        if (event.type === "dblclick") return true;
        return event.button === 0 && zoomTransform(element).k > 1;
      })
      .on("zoom", (event) => {
        layer.current?.setAttribute("transform", event.transform.toString());
        setZoomed(event.transform.k > 1);
      });
    behavior.current = zoomer;
    select(element).call(zoomer);
    return () => {
      select(element).on(".zoom", null);
    };
  }, []);

  useEffect(() => {
    if (svg.current && behavior.current) select(svg.current).call(behavior.current.transform, zoomIdentity);
  }, [shapes]);

  const valueOf = useMemo(() => new Map(data.map((point) => [point.areaCode, point.value])), [data]);
  const precision = useMemo(() => decimalPlaces ?? resolveValuePrecision(data.map((point) => point.value)), [decimalPlaces, data]);
  const shapeOf = useMemo(() => new Map(shapes.map((shape) => [shape.code, shape])), [shapes]);
  const strokeWidth = shapes.length > DENSE_MAP_SHAPES ? THIN_BORDER : NORMAL_BORDER;

  const areas = useMemo(() => {
    if (!scale) return null;
    return shapes.map((shape) => {
      const value = valueOf.get(shape.code);
      return (
        <path
          key={shape.code}
          d={shape.d}
          data-code={shape.code}
          fill={value === undefined ? scale.noDataColor : scale.colorAtValue(value)}
          stroke={borderColor}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      );
    });
  }, [shapes, scale, valueOf, borderColor, strokeWidth]);

  const codeOfEvent = (event: ReactMouseEvent) => (event.target as SVGElement).dataset?.code;
  const trackHover = (event: ReactMouseEvent) => {
    const code = codeOfEvent(event);
    const box = frame.current?.getBoundingClientRect();
    setHover(code && box ? { code, x: event.clientX - box.left, y: event.clientY - box.top, frameWidth: box.width } : null);
  };
  const zoomBy = (factor: number) => {
    if (svg.current && behavior.current) select(svg.current).transition().duration(ZOOM_MS).call(behavior.current.scaleBy, factor);
  };
  const reset = () => {
    if (svg.current && behavior.current) select(svg.current).transition().duration(ZOOM_MS).call(behavior.current.transform, zoomIdentity);
  };

  const hovered = hover ? shapeOf.get(hover.code) : undefined;
  const hoveredValue = hover ? valueOf.get(hover.code) : undefined;
  const selected = selectedCode ? shapeOf.get(selectedCode) : undefined;
  const midpoint = scale && "midpoint" in scale ? scale.midpoint : undefined;

  return (
    <div ref={frame} className="relative h-full w-full overflow-hidden bg-background">
      <svg
        ref={svg}
        viewBox={`0 0 ${GEO_SVG_MAP.width} ${GEO_SVG_MAP.height}`}
        className="h-full w-full"
        // 1 本指の縦スクロールはページへ渡す。拡大中は地図を動かす
        style={{ touchAction: zoomed ? "none" : "pan-y", cursor: zoomed ? "grab" : undefined }}
      >
        <g ref={layer}>
          {insetLine && <line {...insetLine} stroke={borderColor} strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
          <g
            className={onAreaClick ? "cursor-pointer" : undefined}
            onClick={(event) => {
              const code = codeOfEvent(event);
              if (code) onAreaClick?.(code);
            }}
            onMouseMove={trackHover}
            onMouseLeave={() => setHover(null)}
          >
            {areas}
          </g>
          {[selected, hovered].map(
            (shape, index) =>
              shape && (
                <path
                  key={index}
                  d={shape.d}
                  fill="none"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={ACTIVE_BORDER}
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
              ),
          )}
        </g>
      </svg>
      {hover && hovered && (
        <div
          className="pointer-events-none absolute z-500 rounded-sm border border-border bg-background px-2 py-1 text-xs shadow-xs"
          style={{
            left: Math.max(0, Math.min(hover.x + 12, hover.frameWidth - TOOLTIP_WIDTH)),
            top: Math.max(hover.y - 40, 4),
          }}
        >
          <span className="font-medium">{hovered.name}</span>{" "}
          {hoveredValue === undefined ? "データなし" : `${formatValueWithPrecision(hoveredValue, precision)}${unit ? ` ${unit}` : ""}`}
        </div>
      )}
      <div className="absolute bottom-2 right-2 z-500 flex items-center gap-1">
        {zoomed && (
          <Button type="button" variant="outline" size="xs" onClick={reset}>
            全体に戻す
          </Button>
        )}
        {/* タッチは 2 本指で拡大できるのでボタンを出さない */}
        <div className="flex gap-1 [@media(pointer:coarse)]:hidden">
          <Button type="button" variant="outline" size="icon-xs" aria-label="拡大" onClick={() => zoomBy(ZOOM_STEP)}>
            <Plus />
          </Button>
          <Button type="button" variant="outline" size="icon-xs" aria-label="縮小" onClick={() => zoomBy(1 / ZOOM_STEP)}>
            <Minus />
          </Button>
        </div>
      </div>
      {midpoint !== undefined && (
        <p className="absolute bottom-2 left-2 z-500 rounded-sm bg-background/90 px-1.5 py-0.5 text-xs text-muted-foreground">
          基準 {formatValueWithPrecision(midpoint, precision)}
          {unit ? ` ${unit}` : ""}
        </p>
      )}
    </div>
  );
}
