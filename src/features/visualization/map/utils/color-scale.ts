/**
 * コロプレス地図用カラースケール計算ユーティリティ
 */

import * as d3 from "d3";

import type { ChoroplethData } from "../types/index";

/**
 * D3カラースケール関数のマッピング
 */
const COLOR_SCHEMES: Record<string, (t: number) => string> = {
  // Sequential (単色グラデーション)
  interpolateBlues: d3.interpolateBlues,
  interpolateGreens: d3.interpolateGreens,
  interpolateGreys: d3.interpolateGreys,
  interpolateOranges: d3.interpolateOranges,
  interpolatePurples: d3.interpolatePurples,
  interpolateReds: d3.interpolateReds,

  // Sequential (多色)
  interpolateViridis: d3.interpolateViridis,
  interpolatePlasma: d3.interpolatePlasma,
  interpolateInferno: d3.interpolateInferno,
  interpolateMagma: d3.interpolateMagma,
  interpolateTurbo: d3.interpolateTurbo,
  interpolateCool: d3.interpolateCool,
  interpolateWarm: d3.interpolateWarm,

  // Diverging (発散カラースケール)
  interpolateBrBG: d3.interpolateBrBG,
  interpolatePRGn: d3.interpolatePRGn,
  interpolatePiYG: d3.interpolatePiYG,
  interpolatePuOr: d3.interpolatePuOr,
  interpolateRdBu: d3.interpolateRdBu,
  interpolateRdGy: d3.interpolateRdGy,
  interpolateRdYlBu: d3.interpolateRdYlBu,
  interpolateRdYlGn: d3.interpolateRdYlGn,
  interpolateSpectral: d3.interpolateSpectral,
};

/**
 * カラースケール生成オプション
 */
export interface ColorScaleOptions {
  /** データ配列 */
  data: ChoroplethData[];
  /** カラースケール名（デフォルト: "interpolateBlues"） */
  colorScheme?: string;
  /** 分岐点設定（発散カラースケール用） */
  divergingMidpoint?: "zero" | "mean" | "median" | number;
  /** データがない場合の色 */
  noDataColor?: string;
}

/**
 * 分岐点の値を計算
 */
function calculateMidpoint(
  data: ChoroplethData[],
  divergingMidpoint: "zero" | "mean" | "median" | number
): number {
  if (typeof divergingMidpoint === "number") {
    return divergingMidpoint;
  }

  const values = data.map((d) => d.value);

  switch (divergingMidpoint) {
    case "zero":
      return 0;
    case "mean":
      return d3.mean(values) ?? 0;
    case "median":
      return d3.median(values) ?? 0;
    default:
      return 0;
  }
}

/**
 * コロプレス地図用のカラースケールを生成
 */
export function createColorScale(options: ColorScaleOptions) {
  const {
    data,
    colorScheme = "interpolateBlues",
    divergingMidpoint,
    noDataColor = "#e0e0e0",
  } = options;

  // データがない場合は固定色を返す関数
  if (!data || data.length === 0) {
    return () => noDataColor;
  }

  // カラースケール関数を取得
  const interpolator = COLOR_SCHEMES[colorScheme] || d3.interpolateBlues;

  // 値の範囲を取得
  const values = data.map((d) => d.value);
  const minValue = d3.min(values) ?? 0;
  const maxValue = d3.max(values) ?? 0;

  // 発散カラースケールの場合
  if (divergingMidpoint !== undefined) {
    const midpoint = calculateMidpoint(data, divergingMidpoint);

    // スケールを作成（中央値を基準に正規化）
    const maxAbsDistance = Math.max(
      Math.abs(minValue - midpoint),
      Math.abs(maxValue - midpoint)
    );

    return (value: number) => {
      // 中央値からの距離を計算
      const distance = value - midpoint;
      // 0-1の範囲に正規化（中央が0.5）
      const normalized = 0.5 + distance / (2 * maxAbsDistance);
      // 0-1の範囲にクランプ
      const clamped = Math.max(0, Math.min(1, normalized));
      return interpolator(clamped);
    };
  }

  // 通常のカラースケール
  const scale = d3
    .scaleSequential(interpolator)
    .domain([minValue, maxValue]);

  return (value: number) => scale(value);
}

/**
 * 地域コードから色を取得する関数を生成
 */
export function createChoroplethColorMapper(options: ColorScaleOptions) {
  const { data, noDataColor = "#e0e0e0" } = options;

  // データを地域コードでマッピング
  const dataMap = new Map(data.map((d) => [d.areaCode, d.value]));

  // カラースケール関数を作成
  const colorScale = createColorScale(options);

  // 地域コードから色を返す関数
  return (areaCode: string): string => {
    const value = dataMap.get(areaCode);
    if (value === undefined) {
      return noDataColor;
    }
    return colorScale(value);
  };
}

/**
 * カラースケールの凡例用データを生成
 */
export interface LegendItem {
  value: number;
  color: string;
  label: string;
}

export function createLegendData(
  options: ColorScaleOptions,
  steps: number = 5
): LegendItem[] {
  const { data } = options;

  if (!data || data.length === 0) {
    return [];
  }

  const values = data.map((d) => d.value);
  const minValue = d3.min(values) ?? 0;
  const maxValue = d3.max(values) ?? 0;

  const colorScale = createColorScale(options);

  // 等間隔で凡例アイテムを生成
  const legendItems: LegendItem[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1); // 0から1の範囲
    const value = minValue + t * (maxValue - minValue);
    const color = colorScale(value);
    const label = value.toFixed(1);
    legendItems.push({ value, color, label });
  }

  return legendItems;
}
