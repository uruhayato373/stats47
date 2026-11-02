import { TILE_GRID_LAYOUT } from '@stats47/visualization/d3/constants/tile-grid-layout';
// Compact, equal-size cartogram. Position conveys region, never area or magnitude.
export const CHANGE_TILE_LAYOUT: readonly (readonly [
  number,
  number,
  number,
])[] = [
  [1, 10, 0],
  [2, 10, 1],
  [5, 10, 2],
  [3, 11, 2],
  [6, 10, 3],
  [4, 11, 3],
  [7, 10, 4],
  [17, 6, 4],
  [16, 7, 4],
  [15, 8, 4],
  [18, 6, 5],
  [21, 7, 5],
  [20, 8, 5],
  [10, 9, 5],
  [9, 10, 5],
  [8, 11, 5],
  [32, 3, 6],
  [31, 4, 6],
  [28, 5, 6],
  [26, 6, 6],
  [25, 7, 6],
  [19, 8, 6],
  [11, 9, 6],
  [13, 10, 6],
  [12, 11, 6],
  [41, 0, 7],
  [40, 1, 7],
  [35, 2, 7],
  [34, 3, 7],
  [33, 4, 7],
  [27, 5, 7],
  [29, 6, 7],
  [24, 7, 7],
  [23, 8, 7],
  [22, 9, 7],
  [14, 10, 7],
  [42, 0, 8],
  [44, 1, 8],
  [38, 3, 8],
  [37, 4, 8],
  [30, 5, 8],
  [43, 0, 9],
  [45, 1, 9],
  [39, 3, 9],
  [36, 4, 9],
  [46, 0, 10],
  [47, 1, 10],
];

/**
 * 4:5 image layout derived from the site tile layout (the single source): the archipelago shape,
 * Hokkaido's 2×2, the prefectures' spans and Okinawa's separation stay; only rows holding no
 * prefecture (the straits before Aomori and Okinawa) shrink, so tiles can be larger. 2026-11-02.
 */
const BLANK_ROW_HEIGHT = 0.3;
export const IMAGE_TILE_LAYOUT = (() => {
  const rows = Math.max(...TILE_GRID_LAYOUT.map((c) => c.y + (c.h ?? 1)));
  const occupied = new Set(TILE_GRID_LAYOUT.flatMap((c) => Array.from({ length: c.h ?? 1 }, (_, i) => c.y + i)));
  const offset = [0];
  for (let r = 0; r < rows; r++) offset.push(offset[r] + (occupied.has(r) ? 1 : BLANK_ROW_HEIGHT));
  return {
    cols: Math.max(...TILE_GRID_LAYOUT.map((c) => c.x + (c.w ?? 1))),
    rows: offset[rows],
    /** Converts a site grid row to the compressed image row. */
    rowAt: (row: number) => offset[row],
    cells: TILE_GRID_LAYOUT.map((c) => ({ id: c.id, x: c.x, y: offset[c.y], w: c.w ?? 1, h: offset[c.y + (c.h ?? 1)] - offset[c.y] })),
  };
})();
