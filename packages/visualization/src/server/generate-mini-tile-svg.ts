/**
 * ミニタイルグリッドSVG生成（サーバーサイド専用）
 *
 * 47都道府県のタイルグリッドを軽量SVG文字列として生成する。
 * DB に登録された色スキームを named import で解決する（d3 barrel 回避）。
 */

import {
  interpolateBlues,
  interpolateGreens,
  interpolateOranges,
  interpolatePiYG,
  interpolatePurples,
  interpolateRdBu,
  interpolateRdYlBu,
  interpolateRdYlGn,
  interpolateReds,
} from "d3-scale-chromatic";

import { TILE_GRID_LAYOUT } from "../d3/constants/tile-grid-layout";

const INTERPOLATORS: Record<string, (t: number) => string> = {
  interpolateBlues,
  interpolateGreens,
  interpolateOranges,
  interpolatePiYG,
  interpolatePurples,
  interpolateRdBu,
  interpolateRdYlBu,
  interpolateRdYlGn,
  interpolateReds,
};

const NO_DATA_COLOR = "#e5e7eb";

/**
 * ミニタイルグリッドSVGを生成
 */
export function generateMiniTileSvg(
  data: Array<{ areaCode: string; value: number }>,
  colorScheme?: string,
  isReversed?: boolean,
): string {
  const interpolator =
    INTERPOLATORS[colorScheme ?? "interpolateBlues"] ?? INTERPOLATORS.interpolateBlues;

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
