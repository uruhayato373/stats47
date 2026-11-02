import { PREF_CAPITAL_COORDS } from '../../../../../packages/migration-flow/src/lib/pref-capitals';
import { IMAGE_TILE_LAYOUT } from './tile-layout';
import { prefectureShortName } from '@stats47/area/short-name';
import { formatValueWithPrecision, resolveValuePrecision } from '@stats47/utils';

export interface All47Entry {
  areaCode: string;
  areaName: string;
  value: number;
}
/** A resolved colour scale. Callers with a metric pass the site's resolved scale for that metric. */
export interface All47Scale {
  colorAt: (value: number) => string;
  /** Class colours, low to high. Empty for a continuous scale. */
  colors: string[];
  /** Class boundaries (colors.length + 1 values), or [min, max] for a continuous scale. */
  boundaries: number[];
  formatBoundary?: (value: number) => string;
}
export interface All47Options {
  title: string;
  year: string;
  unit: string;
  source: string;
  note?: string;
  capitalCities?: boolean;
  scale?: All47Scale;
}
const escape = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const widthOf = (s: string) =>
  [...s].reduce((a, c) => a + (/[\x20-\x7e]/.test(c) ? 0.58 : 1), 0);
// Same paper/ink as the other statistical samples (apps/web/src/features/ogp/brand.ts BRAND).
const PAPER = '#F8FAFC', INK = '#18283C', MUTED = '#475569';
// Fallback when no metric scale is given: five steps of the brand blue.
const DEFAULT_COLORS = ['#E8EEFB', '#B9C8F1', '#7D97E2', '#4565D0', '#263C9F'];
// The archipelago grid fills the width between the header and the source line.
const MAP = { left: 60, width: 960, top: 262, bottom: 1262 } as const;
const TILE_GAP = 4;
// Top three go in the empty Sea of Japan area left of Hokkaido, above the Ishikawa row (site grid row 6).
const TOP_PANEL = { rowLimit: 6, colLimit: 8, count: 3 } as const;
const LEGEND = { width: 440, height: 22, labelSize: 20 } as const;
// Value column of the top-three panel, measured from the panel's left edge.
const TOP_VALUE_RIGHT = 380;

/** Relative luminance of an `#rrggbb` or `rgb(r, g, b)` colour, for choosing white or ink text. */
function luminance(color: string) {
  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  const rgb = hex ? hex.slice(1).map((h) => parseInt(h, 16)) : (color.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
  const [r, g, b] = rgb.map((c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
// White text when it contrasts more with the tile than ink does (WCAG contrast ratio).
const INK_LUMINANCE = luminance(INK);
const textOn = (fill: string) => {
  const l = luminance(fill);
  return 1.05 / (l + 0.05) > (l + 0.05) / (INK_LUMINANCE + 0.05) ? '#FFFFFF' : INK;
};

function defaultScale(lo: number, hi: number): All47Scale {
  const step = (hi - lo) / DEFAULT_COLORS.length;
  return {
    colors: DEFAULT_COLORS,
    boundaries: DEFAULT_COLORS.map((_, i) => lo + i * step).concat(hi),
    colorAt: (v) => DEFAULT_COLORS[hi === lo ? 2 : Math.min(DEFAULT_COLORS.length - 1, Math.floor((v - lo) / step))],
  };
}

export function renderAll47TileSvg(
  entries: All47Entry[],
  opts: All47Options
): string {
  const rows = new Map(entries.map((r) => [Number(r.areaCode.slice(0, 2)), r]));
  if (
    entries.length !== 47 ||
    rows.size !== 47 ||
    IMAGE_TILE_LAYOUT.cells.some(({ id }) => !rows.has(id)) ||
    entries.some(
      (r) => !/^\d{2}000$/.test(r.areaCode) || !Number.isFinite(r.value)
    )
  )
    throw new Error('全47県タイル図は47県の重複・欠測なし有限値が必要です');
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  const lo = sorted.at(-1)!.value, hi = sorted[0].value;
  const scale = opts.scale ?? defaultScale(lo, hi);
  // One precision for the whole map so 33 and 33.8 read as 33.0 and 33.8 (blog-svg-chart-standards §3).
  const precision = resolveValuePrecision(entries.map((r) => r.value));
  const fmt = (v: number) => formatValueWithPrecision(v, precision);
  const fmtBoundary = scale.formatBoundary ?? fmt;
  const text = (
    s: string,
    x: number,
    y: number,
    size: number,
    maxWidth: number,
    color = INK,
    weight = 700,
    anchor: 'start' | 'middle' | 'end' = 'start'
  ) =>
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${Math.min(size, maxWidth / Math.max(1, widthOf(s))).toFixed(1)}" font-weight="${weight}" fill="${color}"${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}>${escape(s)}</text>`;
  const nameOf = (r: All47Entry) => opts.capitalCities
    ? (r.areaCode === '13000' ? '東京区部' : PREF_CAPITAL_COORDS[r.areaCode.slice(0, 2)].name)
    : prefectureShortName(r.areaName);

  const pitch = Math.min(MAP.width / IMAGE_TILE_LAYOUT.cols, (MAP.bottom - MAP.top) / IMAGE_TILE_LAYOUT.rows);
  const left = MAP.left + (MAP.width - IMAGE_TILE_LAYOUT.cols * pitch) / 2;
  const nameSize = Math.round(pitch * 0.27), valueSize = Math.round(pitch * 0.34);
  const tiles = IMAGE_TILE_LAYOUT.cells.map(({ id, x, y, w, h }) => {
    const r = rows.get(id)!;
    const fill = scale.colorAt(r.value), ink = textOn(fill);
    const width = w * pitch - TILE_GAP, height = h * pitch - TILE_GAP;
    const cx = width / 2, cy = height / 2;
    return `<g transform="translate(${(left + x * pitch).toFixed(1)},${(MAP.top + y * pitch).toFixed(1)})" data-area="${r.areaCode}" data-value="${r.value}"><rect width="${width.toFixed(1)}" height="${height.toFixed(1)}" rx="6" fill="${fill}"/>${text(nameOf(r), cx, cy - 3, nameSize, width - 8, ink, 700, 'middle')}${text(fmt(r.value), cx, cy + valueSize - 1, valueSize, width - 8, ink, 800, 'middle')}</g>`;
  }).join('');

  // Top three (ties share a rank) in the empty sea area left of Hokkaido.
  const ranked = sorted.map((r) => ({ r, rank: sorted.findIndex((o) => o.value === r.value) + 1 }));
  const top = ranked.filter(({ rank }) => rank <= TOP_PANEL.count).slice(0, TOP_PANEL.count + 1);
  const panelWidth = left + TOP_PANEL.colLimit * pitch - 40 - MAP.left;
  const panelTop = MAP.top + 24, rowGap = Math.min(76, (IMAGE_TILE_LAYOUT.rowAt(TOP_PANEL.rowLimit) * pitch - 90) / top.length);
  const unit = opts.unit === 'l' ? 'L' : opts.unit;
  const topPanel = [
    text(opts.capitalCities ? '上位3市' : '上位3県', MAP.left, panelTop + 24, 26, panelWidth, MUTED, 700),
    ...top.map(({ r, rank }, i) => {
      const y = panelTop + 84 + i * rowGap;
      return `<g data-top="${rank}">${text(String(rank), MAP.left + 18, y, 34, 40, MUTED, 700, 'middle')}${text(nameOf(r), MAP.left + 52, y, 40, 180, INK, 700)}${text(fmt(r.value), MAP.left + TOP_VALUE_RIGHT - 4 - widthOf(unit) * 24, y, 44, 150, INK, 800, 'end')}${text(unit, MAP.left + TOP_VALUE_RIGHT, y, 24, widthOf(unit) * 24, MUTED, 700, 'end')}</g>`;
    }),
  ].join('');

  // Legend in the bottom-right corner: class colours with their boundaries (or a gradient for continuous).
  const legendX = MAP.left + MAP.width - LEGEND.width, legendY = MAP.bottom - 64;
  const steps = scale.colors.length || 60;
  const swatches = Array.from({ length: steps }, (_, i) => {
    const fill = scale.colors.length ? scale.colors[i] : scale.colorAt(scale.boundaries[0] + (scale.boundaries[1] - scale.boundaries[0]) * i / (steps - 1));
    return `<rect x="${(legendX + LEGEND.width * i / steps).toFixed(1)}" y="${legendY}" width="${(LEGEND.width / steps + 0.5).toFixed(1)}" height="${LEGEND.height}" fill="${fill}"/>`;
  }).join('');
  const marks = scale.boundaries.map((value, i, all) => {
    const x = legendX + LEGEND.width * i / (all.length - 1);
    return text(fmtBoundary(value), x, legendY + LEGEND.height + 26, LEGEND.labelSize, 64, MUTED, 400, i === 0 ? 'start' : i === all.length - 1 ? 'end' : 'middle');
  }).join('');

  // Minimal copy (chart-image-copy.md): metric, year, unit, the city/prefecture scope, legend and source.
  // No publisher, slogans or how-to-read notes; those belong to the post text.
  // State the capital-city scope once; skip it here when the definition line already says so.
  const scope = opts.capitalCities && !/県庁所在市/.test(opts.note ?? '') ? ' · 県庁所在市' : '';
  // A lowercase l reads as 1 at phone width; show the litre symbol as L.
  const meta = `${opts.year} · 単位：${unit}${scope}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${PAPER}"/><g font-family="'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',Meiryo,sans-serif">
    ${text(opts.title, 60, 120, 64, 960)}${text(meta, 60, 180, 30, 960, MUTED, 400)}
    ${opts.note ? text(opts.note, 60, 222, 24, 960, MUTED, 400) : ''}
    ${topPanel}
    ${tiles}
    ${swatches}${marks}
    ${text('出典：' + opts.source, 60, 1310, 22, 960, MUTED, 400)}
  </g></svg>`;
}
