/**
 * ミニタイルグリッドSVG生成（サーバーサイド専用）
 *
 * 47都道府県のタイルグリッドを軽量SVG文字列として生成する。
 * D3の interpolate* 関数を動的解決し、DB登録済みの全カラースキームに対応する。
 */

import * as d3 from "d3";

import { TILE_GRID_LAYOUT } from "../d3/constants/tile-grid-layout";
import { resolveColorInterpolator } from "../d3/utils/color-scale/create-color-schemes";

const NO_DATA_COLOR = "#e5e7eb";

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
  const interpolator = resolveColorInterpolator(d3, colorScheme ?? "interpolateBlues");

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
    const fill = val !== undefined ? interpolator(toT(val)) : NO_DATA_COLOR;
    return `<rect x="${cell.x}" y="${cell.y}" width="${w}" height="${h}" rx=".12" fill="${fill}" stroke="#fff" stroke-width=".08"/>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 16 17" preserveAspectRatio="xMidYMid meet">${rects.join("")}</svg>`;
}
