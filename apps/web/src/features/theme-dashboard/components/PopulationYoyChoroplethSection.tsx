"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

const DATA_URL = "/themes/population-dynamics/yoy-timeseries.json";
const TOPO_URL = "/prefecture.topojson";
const COLOR_CLAMP = 0.01;
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

const colorScale = scaleDiverging(interpolateRdBu)
  .domain([1 - COLOR_CLAMP, 1, 1 + COLOR_CLAMP])
  .clamp(true);

interface HoverState {
  areaCode: string;
  areaName: string;
  ratio: number;
  x: number;
  y: number;
  containerWidth: number;
}

export function PopulationYoyChoroplethSection() {
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
      fetch(DATA_URL).then((r) => r.json()) as Promise<YoyTimeseries>,
    ])
      .then(([t, d]) => {
        if (cancelled) return;
        setTopology(t);
        setTimeseries(d);
      })
      .catch(() => {
        // YoY data load failed; chart will stay empty
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 自動再生: 1.2秒/年で進める、最終年に達したら停止
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
    // 終端で停止していたら最初から再生
    if (frameIndex >= timeseries.frames.length - 1) {
      setFrameIndex(0);
    }
    setIsPlaying((p) => !p);
  }, [frameIndex, timeseries]);

  if (!topology || !timeseries) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        人口前年度比チャートを読み込み中...
      </div>
    );
  }

  const yearStart = timeseries.frames[0].year;
  const yearEnd = timeseries.frames[timeseries.frames.length - 1].year;
  const tokyo = ratioByCode.get("13");

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-3">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-foreground">
            人口の前年度比で見る {yearStart}〜{yearEnd}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            東京一極集中がいつ始まり、平成不況で中断し、2000年代に再加速したかを色で可視化
          </p>
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
          aria-label={`${currentFrame?.year}年 人口前年度比 コロプレス`}
        >
          {projectedPaths.map((p) => {
            const rec = ratioByCode.get(p.areaCode);
            const fill = rec ? colorScale(rec.ratio) : "#e0e0e0";
            const isHovered = hover?.areaCode === p.areaCode;
            return (
              <path
                key={p.areaCode}
                d={p.path}
                fill={fill}
                stroke={isHovered ? "#0F172A" : "rgba(15,23,42,0.25)"}
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

      {/* コントロール: 再生ボタン + 年スクラバー */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-accent"
          aria-label={isPlaying ? "一時停止" : "再生"}
        >
          {isPlaying ? "⏸ 一時停止" : "▶ 再生"}
        </button>
        <input
          type="range"
          min={0}
          max={timeseries.frames.length - 1}
          value={frameIndex}
          onChange={(e) => handleScrubber(Number(e.target.value))}
          className="flex-1"
          aria-label="年スクラバー"
        />
        <div className="w-12 text-right text-xs tabular-nums text-muted-foreground">
          {currentFrame?.year}
        </div>
      </div>

      {/* 凡例 + 東京ハイライト */}
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
            （±{(COLOR_CLAMP * 100).toFixed(1)}%/年 clamp、5年移動平均）
          </span>
        </div>
        {tokyo && (
          <div className="text-muted-foreground">
            東京:{" "}
            <span
              className={`font-bold tabular-nums ${
                tokyo.ratio >= 1 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {tokyo.ratio >= 1 ? "+" : ""}
              {((tokyo.ratio - 1) * 100).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
