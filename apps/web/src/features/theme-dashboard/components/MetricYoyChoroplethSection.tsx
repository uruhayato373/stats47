"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button, Slider } from "@stats47/components";
import { geoMercator, geoPath } from "d3-geo";
import { scaleDiverging } from "d3-scale";
import { interpolateRdBu } from "d3-scale-chromatic";
import { feature } from "topojson-client";

import type { Feature, FeatureCollection } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

interface YoyRecord {
  areaCode: string;
  areaName: string;
  ratio: number;
}

interface YoyFrame {
  year: number;
  yoy: YoyRecord[];
}

interface YoyTimeseries {
  yearRange: [number, number];
  movingAverageWindow: number;
  maxAbs: number;
  prefectureCodes: string[];
  frames: YoyFrame[];
}

const TOPO_URL = "/prefecture.topojson";
const VIEWBOX_W = 600;
const VIEWBOX_H = 720;
const FRAME_INTERVAL_MS = 1200;

function projectPaths(topology: Topology) {
  const objectName = Object.keys(topology.objects)[0];
  const geojson = feature(
    topology,
    topology.objects[objectName] as GeometryCollection,
  ) as FeatureCollection;

  const projection = geoMercator()
    .center([137, 37])
    .scale(1800)
    .translate([VIEWBOX_W / 2, VIEWBOX_H / 2]);
  const pathGen = geoPath().projection(projection);

  return geojson.features.map((feat: Feature) => ({
    areaCode: (feat.properties?.N03_007 ?? "") as string,
    areaName: (feat.properties?.N03_001 ?? "") as string,
    path: pathGen(feat) ?? "",
  }));
}

interface HoverState {
  areaCode: string;
  areaName: string;
  ratio: number;
  x: number;
  y: number;
  containerWidth: number;
}

export interface MetricYoyChoroplethSectionProps {
  /** YoY タイムシリーズ JSON への URL (apps/web/public/themes/.../yoy-*.json) */
  dataUrl: string;
  /** ヘッダーのタイトル (例: "人口の前年度比") */
  title: string;
  /** タイトル下の説明文 (1 行、物語) */
  subtitle?: string;
  /**
   * 配色 domain の上限 (|ratio-1|)。
   * 未指定の場合はデータの maxAbs の 40% を使う (vivid な濃淡が出る)。
   * 強い変動指標 (自殺率等) では 0.05〜0.10、弱い指標 (人口) では 0.01。
   */
  colorClamp?: number;
  /** ハイライト表示する都道府県コード (2 桁、未指定なら "13" 東京) */
  highlightAreaCode?: string;
  /** ハイライト表示ラベル (未指定なら highlightAreaCode から area name を引く) */
  highlightLabel?: string;
}

export function MetricYoyChoroplethSection({
  dataUrl,
  title,
  subtitle,
  colorClamp,
  highlightAreaCode = "13",
  highlightLabel,
}: MetricYoyChoroplethSectionProps) {
  const [topology, setTopology] = useState<Topology | null>(null);
  const [timeseries, setTimeseries] = useState<YoyTimeseries | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hover, setHover] = useState<HoverState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(TOPO_URL).then((r) => r.json()) as Promise<Topology>,
      fetch(dataUrl).then((r) => r.json()) as Promise<YoyTimeseries>,
    ])
      .then(([t, d]) => {
        if (cancelled) return;
        setTopology(t);
        setTimeseries(d);
        setFrameIndex(0);
        setIsPlaying(true);
      })
      .catch(() => {
        // load failed; section stays empty
      });
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  // 配色: clamp が未指定なら maxAbs の 40% を使う
  const effectiveClamp = useMemo(() => {
    if (colorClamp !== undefined) return colorClamp;
    if (!timeseries) return 0.01;
    return Math.max(0.005, timeseries.maxAbs * 0.4);
  }, [colorClamp, timeseries]);

  const colorScale = useMemo(
    () =>
      scaleDiverging(interpolateRdBu)
        .domain([1 - effectiveClamp, 1, 1 + effectiveClamp])
        .clamp(true),
    [effectiveClamp],
  );

  // 自動再生: 1.2秒/年、終端で停止
  useEffect(() => {
    if (!isPlaying || !timeseries) return;
    const total = timeseries.frames.length;
    const id = window.setInterval(() => {
      setFrameIndex((i) => {
        if (i + 1 >= total) {
          setIsPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, FRAME_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isPlaying, timeseries]);

  const projectedPaths = useMemo(() => {
    if (!topology) return [];
    return projectPaths(topology);
  }, [topology]);

  const currentFrame = timeseries?.frames[frameIndex];
  const ratioByCode = useMemo(() => {
    if (!currentFrame) return new Map<string, YoyRecord>();
    const m = new Map<string, YoyRecord>();
    for (const r of currentFrame.yoy) m.set(r.areaCode, r);
    return m;
  }, [currentFrame]);

  const handleScrubber = useCallback((value: number) => {
    setIsPlaying(false);
    setFrameIndex(value);
  }, []);

  const togglePlay = useCallback(() => {
    if (!timeseries) return;
    if (frameIndex >= timeseries.frames.length - 1) {
      setFrameIndex(0);
    }
    setIsPlaying((p) => !p);
  }, [frameIndex, timeseries]);

  if (!topology || !timeseries) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        {title}を読み込み中...
      </div>
    );
  }

  const yearStart = timeseries.frames[0].year;
  const yearEnd = timeseries.frames[timeseries.frames.length - 1].year;
  const highlightRec = ratioByCode.get(highlightAreaCode);
  const resolvedHighlightLabel =
    highlightLabel ?? highlightRec?.areaName ?? "";

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-3">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-foreground">
            {title} ({yearStart}〜{yearEnd})
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-black tabular-nums text-foreground">
            {currentFrame?.year}
          </div>
          <div className="text-xs text-muted-foreground">
            {frameIndex + 1} / {timeseries.frames.length}
          </div>
        </div>
      </header>

      <div className="relative" ref={containerRef}>
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          className="w-full h-auto"
          role="img"
          aria-label={`${currentFrame?.year}年 ${title} コロプレス`}
        >
          {projectedPaths.map((p) => {
            const rec = ratioByCode.get(p.areaCode);
            const fill = rec ? colorScale(rec.ratio) : "hsl(var(--muted))";
            const isHovered = hover?.areaCode === p.areaCode;
            return (
              <path
                key={p.areaCode}
                d={p.path}
                fill={fill}
                stroke={isHovered ? "hsl(var(--foreground))" : "hsl(var(--border))"}
                strokeWidth={isHovered ? 1.5 : 0.5}
                strokeLinejoin="round"
                onMouseEnter={(e) => {
                  if (!rec || !containerRef.current) return;
                  const rect = containerRef.current.getBoundingClientRect();
                  setHover({
                    areaCode: p.areaCode,
                    areaName: rec.areaName,
                    ratio: rec.ratio,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    containerWidth: rect.width,
                  });
                }}
                onMouseMove={(e) => {
                  if (!containerRef.current) return;
                  const rect = containerRef.current.getBoundingClientRect();
                  setHover((h) =>
                    h && h.areaCode === p.areaCode
                      ? {
                          ...h,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                          containerWidth: rect.width,
                        }
                      : h,
                  );
                }}
                onMouseLeave={() => setHover(null)}
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
            <div className="font-bold text-foreground">{hover.areaName}</div>
            <div
              className={`tabular-nums ${
                hover.ratio >= 1 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {hover.ratio >= 1 ? "+" : ""}
              {((hover.ratio - 1) * 100).toFixed(2)}%/年
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={togglePlay}
          className="text-xs font-medium"
          aria-label={isPlaying ? "一時停止" : "再生"}
        >
          {isPlaying ? "⏸ 一時停止" : "▶ 再生"}
        </Button>
        <Slider
          min={0}
          max={timeseries.frames.length - 1}
          step={1}
          value={[frameIndex]}
          onValueChange={(v) => handleScrubber(v[0])}
          className="flex-1"
          aria-label="年スクラバー"
        />
        <div className="w-12 text-right text-xs tabular-nums text-muted-foreground">
          {currentFrame?.year}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-red-600">← 減少</span>
          <div
            className="h-2 w-32 rounded-sm"
            style={{
              background:
                "linear-gradient(to right, #b2182b, #ef8a62, #f7f7f7, #67a9cf, #2166ac)",
            }}
          />
          <span className="font-medium text-blue-600">増加 →</span>
          <span className="text-muted-foreground">
            （±{(effectiveClamp * 100).toFixed(1)}%/年 clamp、5年移動平均）
          </span>
        </div>
        {highlightRec && (
          <div className="text-muted-foreground">
            {resolvedHighlightLabel}:{" "}
            <span
              className={`font-bold tabular-nums ${
                highlightRec.ratio >= 1 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {highlightRec.ratio >= 1 ? "+" : ""}
              {((highlightRec.ratio - 1) * 100).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
