import React, { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import * as chromatic from "d3-scale-chromatic";
import type { Topology } from "topojson-specification";

import {
  computeChoroplethPaths,
  resolveRankingData,
  type ChoroplethPathInfo,
  type RankingEntry,
  type RankingMeta,
} from "@/shared";
import { PREFECTURE_TOPOJSON_FILE } from "../../shared/utils/static-files";

/**
 * note ランキング記事の画像 4 枚 (cover / map / chart / boxplot) が共有する定義。
 * 入力は chart-data.json から作った props だけで、色スケールは地図・凡例・棒グラフで同じものを使う。
 * 契約: .claude/rules/note-image-assets.md
 */

/** render-spec.json の palette の既定。テンプレートを変えたら NOTE_RENDER_TEMPLATE_VERSION (note-render-spec.mjs) も上げる */
export const NOTE_DEFAULT_PALETTE = "interpolateYlGnBu";

export interface NoteImageProps {
  theme?: "light" | "dark";
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  displayTitle?: string;
  hookText?: string;
  colorScheme?: string;
  /** 生成 AI の背景 (data URI)。render-spec.json の background を SHA 検証した上で渡される。カバーだけが使う */
  backgroundImage?: string;
  /** chart-data.json の summary.mean (記事本文の全国平均)。未指定なら 47 県の単純平均 */
  mean?: number;
}

export function getInterpolator(name?: string): (t: number) => string {
  const fn = (chromatic as Record<string, unknown>)[name ?? NOTE_DEFAULT_PALETTE];
  return typeof fn === "function" ? (fn as (t: number) => string) : chromatic.interpolateBlues;
}

/**
 * 色は「値」でなく「順位」で決める (1 位が最も濃く、47 位が最も薄い)。
 * 値で塗ると、東京都・北海道のような外れ値が 1 県あるだけで残りの 46 県が同じ薄い色になり、地図から分布が読めない
 * (農業産出額・昼間人口・発電電力量で実際に起きた)。地図・凡例・棒グラフで同じ関数を使う。
 */
export function rankColor(rank: number, palette?: string, total = 47): string {
  return getInterpolator(palette)((total - rank) / (total - 1));
}

/** 「東京都」「大阪府」「青森県」→ 接尾辞を除いた短縮名 (北海道はそのまま) */
export function shortPrefName(name: string): string {
  return name === "北海道" ? name : name.replace(/[都府県]$/, "");
}

export function formatNoteValue(value: number, precision: number): string {
  return value.toLocaleString("ja-JP", { minimumFractionDigits: precision, maximumFractionDigits: precision });
}

/**
 * props を解決する。resolveRankingData は props 欠落時に別指標のモックへ黙ってフォールバックするため、
 * note 画像では欠落を例外にして、他記事のデータで画像が焼かれる事故を防ぐ。
 */
export function resolveNoteData(props: NoteImageProps) {
  if (!props.meta || !props.allEntries || props.allEntries.length !== 47) {
    throw new Error(
      `note 画像には meta と 47 件の allEntries が必要です (受信: ${props.allEntries?.length ?? "none"} 件)。` +
        " render-ranking-images.mjs 経由で chart-data.json から props を作ってください。"
    );
  }
  const resolved = resolveRankingData({ meta: props.meta, allEntries: props.allEntries });
  const entries = [...resolved.entries].sort((a, b) => a.rank - b.rank);
  const values = entries.map((e) => e.value);
  const mean = props.mean ?? values.reduce((sum, v) => sum + v, 0) / values.length;
  return { meta: resolved.meta, entries, precision: resolved.precision, mean, min: Math.min(...values), max: Math.max(...values) };
}

export interface NoteMapLayout {
  width: number;
  height: number;
  padding?: number;
  offsetX?: number;
  offsetY?: number;
}

/** TopoJSON を読み、コロプレスの SVG パスを計算する (delayRender で描画完了を待つ) */
export function useNoteMapPaths(
  entries: RankingEntry[],
  palette: string | undefined,
  layout: NoteMapLayout
): ChoroplethPathInfo[] | null {
  const [handle] = useState(() => delayRender("Loading TopoJSON"));
  const [paths, setPaths] = useState<ChoroplethPathInfo[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(staticFile(PREFECTURE_TOPOJSON_FILE));
        const topology = (await res.json()) as Topology;
        if (cancelled) return;
        setPaths(
          // computeChoroplethPaths は値を線形に塗る。順位から作った疑似値 (1 位 = 47 … 47 位 = 1) を渡して順位で塗らせる
          computeChoroplethPaths(topology, entries.map((e) => ({ areaCode: e.areaCode, value: entries.length + 1 - e.rank })), {
            colorScheme: palette ?? NOTE_DEFAULT_PALETTE,
            noDataColor: "#e2e8f0",
            width: layout.width,
            height: layout.height,
            padding: layout.padding ?? 0,
            offsetX: layout.offsetX ?? 0,
            offsetY: layout.offsetY ?? 0,
          })
        );
      } catch (err) {
        console.error("Failed to load TopoJSON:", err);
      } finally {
        continueRender(handle);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, palette, entries]);

  return paths;
}

/** 順位の凡例: 濃いほど上位。両端に 47 位と 1 位の値、下に全国平均 */
export const NoteLegend: React.FC<{
  min: number;
  max: number;
  mean: number;
  unit?: string;
  precision: number;
  palette?: string;
  width: number;
  fontSize?: number;
}> = ({ min, max, mean, unit, precision, palette, width, fontSize = 18 }) => {
  const interp = getInterpolator(palette);
  const stops = Array.from({ length: 11 }, (_, i) => `${interp(i / 10)} ${i * 10}%`).join(", ");
  const unitText = unit ? ` ${unit}` : "";
  return (
    <div style={{ width, fontSize, color: "#475569", fontWeight: 600 }}>
      <div style={{ height: 14, borderRadius: 7, background: `linear-gradient(90deg, ${stops})`, border: "1px solid rgba(15,23,42,0.18)" }} />
      <div style={{ position: "relative", height: fontSize * 1.6, marginTop: 6 }}>
        <span style={{ position: "absolute", left: 0 }}>47位 {formatNoteValue(min, precision)}{unitText}</span>
        <span style={{ position: "absolute", right: 0 }}>1位 {formatNoteValue(max, precision)}{unitText}</span>
      </div>
      <div style={{ textAlign: "center", marginTop: 2, color: "#0f172a" }}>色は順位 ・ 全国平均 {formatNoteValue(mean, precision)}{unitText}</div>
    </div>
  );
};
