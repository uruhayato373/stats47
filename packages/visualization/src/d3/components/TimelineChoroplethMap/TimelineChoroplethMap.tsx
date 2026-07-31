"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, Slider } from "@stats47/components";

import type { Topology } from "topojson-specification";

import { DEFAULT_DIVERGING_SCHEME } from "@stats47/types";

import { legendGradientCss } from "../../utils/color-scale/legend-gradient";
import { DivergingChoroplethMap } from "../DivergingChoroplethMap";
import type {
  DivergingChoroplethMapFixedProjection,
  DivergingChoroplethMapProjection,
  DivergingChoroplethValue,
} from "../DivergingChoroplethMap";

const FRAME_INTERVAL_MS = 1200;

export interface TimelineChoroplethFrame {
  year: number;
  /** ratio keyed by areaCode */
  values: Array<{ areaCode: string; areaName: string; ratio: number }>;
}

export interface TimelineChoroplethMapProps {
  topology: Topology;
  frames: TimelineChoroplethFrame[];
  /** Half-width of the color domain */
  colorClamp: number;
  /** 配色 (正典形 / 短縮形どちらも可)。既定は発散配色 interpolateRdBu。凡例も同じ値から導出する */
  colorScheme?: string;
  projection:
    | DivergingChoroplethMapProjection
    | DivergingChoroplethMapFixedProjection;
  codeProp?: string;
  nameProp?: string;
  excludeCodes?: Set<string>;
  valueFormatter?: (ratio: number) => string;
  showLegend?: boolean;
  ariaLabel?: string;
  /** Currently displayed year label (shown in header) */
  title?: string;
  subtitle?: string;
  /** Area code to highlight in the footer (e.g. "13") */
  highlightAreaCode?: string;
  highlightLabel?: string;
}

export function TimelineChoroplethMap({
  topology,
  frames,
  colorClamp,
  colorScheme = DEFAULT_DIVERGING_SCHEME,
  projection,
  codeProp,
  nameProp,
  excludeCodes,
  valueFormatter,
  showLegend = true,
  ariaLabel,
  title,
  subtitle,
  highlightAreaCode = "13",
  highlightLabel,
}: TimelineChoroplethMapProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    setFrameIndex(0);
    setIsPlaying(true);
  }, [frames]);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    const id = window.setInterval(() => {
      setFrameIndex((i) => {
        if (i + 1 >= frames.length) {
          setIsPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, FRAME_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isPlaying, frames.length]);

  const currentFrame = frames[frameIndex];

  const valueByCode = useMemo<Map<string, DivergingChoroplethValue>>(() => {
    if (!currentFrame) return new Map();
    const m = new Map<string, DivergingChoroplethValue>();
    for (const v of currentFrame.values) {
      m.set(v.areaCode, { name: v.areaName, ratio: v.ratio });
    }
    return m;
  }, [currentFrame]);

  const highlightRec = currentFrame?.values.find(
    (v) => v.areaCode === highlightAreaCode,
  );
  const resolvedHighlightLabel =
    highlightLabel ?? highlightRec?.areaName ?? "";

  const handleScrubber = useCallback((value: number) => {
    setIsPlaying(false);
    setFrameIndex(value);
  }, []);

  const togglePlay = useCallback(() => {
    if (frameIndex >= frames.length - 1) setFrameIndex(0);
    setIsPlaying((p) => !p);
  }, [frameIndex, frames.length]);

  if (frames.length === 0) return null;

  const yearStart = frames[0].year;
  const yearEnd = frames[frames.length - 1].year;

  return (
    <div className="space-y-3">
      {(title || subtitle) && (
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            {title && (
              <h3 className="text-base font-bold text-foreground">
                {title} ({yearStart}〜{yearEnd})
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-black tabular-nums text-foreground">
              {currentFrame?.year}
            </div>
            <div className="text-xs text-muted-foreground">
              {frameIndex + 1} / {frames.length}
            </div>
          </div>
        </header>
      )}

      <DivergingChoroplethMap
        topology={topology}
        valueByCode={valueByCode}
        codeProp={codeProp}
        nameProp={nameProp}
        colorClamp={colorClamp}
        colorScheme={colorScheme}
        projection={projection}
        excludeCodes={excludeCodes}
        valueFormatter={valueFormatter}
        showLegend={false}
        ariaLabel={ariaLabel ?? `${currentFrame?.year}年 コロプレス`}
      />

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
          max={frames.length - 1}
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

      {showLegend && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-red-600">← 減少</span>
            <div
              className="h-2 w-32 rounded-sm"
              style={{
                background:
                  legendGradientCss(colorScheme, { reverse: true }),
              }}
            />
            <span className="font-medium text-blue-600">増加 →</span>
            <span className="text-muted-foreground">
              ±{(colorClamp * 100).toFixed(1)}%
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
      )}
    </div>
  );
}
