/**
 * ミニタイルグリッドSVG生成（サーバーサイド専用）
 *
 * 47都道府県のタイルグリッドを軽量SVG文字列として生成する。
 * D3不要。カード内サムネイル用途を想定。
 */

import { TILE_GRID_LAYOUT } from "../d3/constants/tile-grid-layout";

// ─── カラースキーム定義（RGB色停点） ────────────────────────────

type ColorStop = { t: number; r: number; g: number; b: number };

const SCHEME_STOPS: Record<string, ColorStop[]> = {
  interpolateBlues: [
    { t: 0.0, r: 239, g: 243, b: 255 },
    { t: 0.5, r: 107, g: 174, b: 214 },
    { t: 1.0, r: 8, g: 81, b: 156 },
  ],
  interpolateReds: [
    { t: 0.0, r: 254, g: 229, b: 217 },
    { t: 0.5, r: 251, g: 106, b: 74 },
    { t: 1.0, r: 165, g: 15, b: 21 },
  ],
  interpolateGreens: [
    { t: 0.0, r: 229, g: 245, b: 224 },
    { t: 0.5, r: 116, g: 196, b: 118 },
    { t: 1.0, r: 0, g: 109, b: 44 },
  ],
  interpolateOranges: [
    { t: 0.0, r: 254, g: 230, b: 206 },
    { t: 0.5, r: 253, g: 141, b: 60 },
    { t: 1.0, r: 166, g: 54, b: 3 },
  ],
  interpolatePurples: [
    { t: 0.0, r: 239, g: 237, b: 245 },
    { t: 0.5, r: 158, g: 154, b: 200 },
    { t: 1.0, r: 84, g: 39, b: 143 },
  ],
  interpolateYlOrRd: [
    { t: 0.0, r: 255, g: 255, b: 178 },
    { t: 0.5, r: 253, g: 141, b: 60 },
    { t: 1.0, r: 189, g: 0, b: 38 },
  ],
  interpolateYlGnBu: [
    { t: 0.0, r: 255, g: 255, b: 217 },
    { t: 0.5, r: 65, g: 182, b: 196 },
    { t: 1.0, r: 8, g: 29, b: 88 },
  ],
  interpolateRdYlGn: [
    { t: 0.0, r: 215, g: 48, b: 39 },
    { t: 0.5, r: 255, g: 255, b: 191 },
    { t: 1.0, r: 26, g: 152, b: 80 },
  ],
};

const DEFAULT_STOPS = SCHEME_STOPS.interpolateBlues;
const NO_DATA_COLOR = "#e5e7eb";

function interpolateColor(t: number, stops: ColorStop[]): string {
  t = Math.max(0, Math.min(1, t));
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t <= stops[i + 1].t) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const s = (t - lo.t) / (hi.t - lo.t);
  const r = Math.round(lo.r + s * (hi.r - lo.r));
  const g = Math.round(lo.g + s * (hi.g - lo.g));
  const b = Math.round(lo.b + s * (hi.b - lo.b));
  return `rgb(${r},${g},${b})`;
}

// ─── SVG 生成 ───────────────────────────────────────────────────

/**
 * ミニタイルグリッドSVGを生成
 *
 * @param data - 47都道府県の値データ（areaCode: "01000"形式）
 * @param colorScheme - D3カラースキーム名（省略時: interpolateBlues）
 * @param isReversed - カラースケールを反転するか
 * @returns SVG文字列
 */
export function generateMiniTileSvg(
  data: Array<{ areaCode: string; value: number }>,
  colorScheme?: string,
  isReversed?: boolean,
): string {
  const stops = SCHEME_STOPS[colorScheme ?? ""] ?? DEFAULT_STOPS;

  // areaCode "01000" → prefCode 1
  const valueMap = new Map<number, number>();
  for (const d of data) {
    const prefCode = parseInt(d.areaCode.substring(0, 2), 10);
    valueMap.set(prefCode, d.value);
  }

  // min/max
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal;

  const toT = (v: number): number => {
    if (range === 0) return 0.5;
    const t = (v - minVal) / range;
    return isReversed ? 1 - t : t;
  };

  // セル描画
  const rects = TILE_GRID_LAYOUT.map((cell) => {
    const val = valueMap.get(cell.id);
    const w = cell.w ?? 1;
    const h = cell.h ?? 1;
    const fill = val !== undefined ? interpolateColor(toT(val), stops) : NO_DATA_COLOR;
    return `<rect x="${cell.x}" y="${cell.y}" width="${w}" height="${h}" rx=".12" fill="${fill}" stroke="#fff" stroke-width=".08"/>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 16 17" preserveAspectRatio="xMidYMid meet">${rects.join("")}</svg>`;
}
