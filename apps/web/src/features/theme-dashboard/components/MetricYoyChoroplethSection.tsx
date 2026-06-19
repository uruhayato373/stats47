"use client";

import { useEffect, useMemo, useState } from "react";

import { TimelineChoroplethMap } from "@stats47/visualization/d3/TimelineChoroplethMap";
import type { TimelineChoroplethFrame } from "@stats47/visualization/d3/TimelineChoroplethMap";

import type { Topology } from "topojson-specification";

interface YoyRecord {
  areaCode: string;
  areaName: string;
  ratio: number;
}

interface YoyTimeseries {
  yearRange: [number, number];
  movingAverageWindow: number;
  maxAbs: number;
  prefectureCodes: string[];
  frames: Array<{ year: number; yoy: YoyRecord[] }>;
}

const TOPO_URL = "/prefecture.topojson";

interface MetricYoyChoroplethSectionProps {
  /** YoY タイムシリーズ JSON への URL */
  dataUrl: string;
  /** ヘッダーのタイトル */
  title: string;
  /** タイトル下の説明文 */
  subtitle?: string;
  /**
   * 配色 domain の上限 (|ratio-1|)。
   * 未指定の場合はデータの maxAbs の 40% を使う。
   */
  colorClamp?: number;
  /** ハイライト表示する都道府県コード (2 桁、未指定なら "13" 東京) */
  highlightAreaCode?: string;
  /** ハイライト表示ラベル */
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
      })
      .catch(() => {
        // load failed; section stays empty
      });
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  const effectiveClamp = useMemo(() => {
    if (colorClamp !== undefined) return colorClamp;
    if (!timeseries) return 0.01;
    return Math.max(0.005, timeseries.maxAbs * 0.4);
  }, [colorClamp, timeseries]);

  const frames = useMemo<TimelineChoroplethFrame[]>(() => {
    if (!timeseries) return [];
    return timeseries.frames.map((f) => ({
      year: f.year,
      values: f.yoy.map((r) => ({
        areaCode: r.areaCode,
        areaName: r.areaName,
        ratio: r.ratio,
      })),
    }));
  }, [timeseries]);

  if (!topology || !timeseries) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        {title}を読み込み中...
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-3">
      <TimelineChoroplethMap
        topology={topology}
        frames={frames}
        colorClamp={effectiveClamp}
        projection={{
          mode: "fixed",
          center: [137, 37],
          scale: 1800,
          viewBoxW: 600,
          viewBoxH: 720,
        }}
        codeProp="N03_007"
        nameProp="N03_001"
        valueFormatter={(ratio) => {
          const pct = (ratio - 1) * 100;
          return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%/年`;
        }}
        showLegend
        title={title}
        subtitle={subtitle}
        highlightAreaCode={highlightAreaCode}
        highlightLabel={highlightLabel}
        ariaLabel={`${title} コロプレス`}
      />
    </section>
  );
}
