import { PREF_CAPITAL_COORDS } from '../../../../../packages/migration-flow/src/lib/pref-capitals';
import { IMAGE_TILE_LAYOUT } from './tile-layout';
import { prefectureShortName } from '@stats47/area/short-name';
import { prefectureNameOf } from '@stats47/area';
import { formatValueWithPrecision, resolveValuePrecision } from '@stats47/utils';
import { LIGHT_THEME, outlineAttrs, type ChartTheme } from './chart-theme';

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
  /** false for open-ended classes (e.g. "under −30%"): the legend labels only the inner boundaries. */
  labelEnds?: boolean;
}
export interface All47Options {
  title: string;
  year: string;
  unit: string;
  source: string;
  note?: string;
  capitalCities?: boolean;
  scale?: All47Scale;
  formatValue?: (value: number) => string;
  panel?: All47Panel;
  /** Paper and text colours (light by default); tile colours do not change. */
  theme?: ChartTheme;
  /** The area the others are measured against (e.g. Osaka in Osaka's moves): written 基準, not a value. */
  baseAreaCode?: string;
}
const escape = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const widthOf = (s: string) =>
  [...s].reduce((a, c) => a + (/[\x20-\x7e]/.test(c) ? 0.58 : 1), 0);
// Tile labels are ink or white by contrast with the tile, in either theme.
const INK = LIGHT_THEME.ink;
// Fallback when no metric scale is given: five steps of the brand blue.
const DEFAULT_COLORS = ['#E8EEFB', '#B9C8F1', '#7D97E2', '#4565D0', '#263C9F'];
// The archipelago grid fills the width between the header and the source line.
const MAP = { left: 60, width: 960, top: 262, bottom: 1262 } as const;
const TILE_GAP = 4;
// Top three go in the empty Sea of Japan area left of Hokkaido, above the Ishikawa row (site grid row 6).
const TOP_PANEL = { rowLimit: 6, colLimit: 8, count: 3 } as const;
// Legend rows (colour, range, count), shared with the real-shape map; a gradient bar only for a continuous scale.
const LEGEND = { width: 330, rowHeight: 44, swatch: 30, labelSize: 24, barWidth: 440, barHeight: 22 } as const;
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
const nameOf = (r: All47Entry, capitalCities?: boolean) => capitalCities
  ? (r.areaCode === '13000' ? '東京区部' : PREF_CAPITAL_COORDS[r.areaCode.slice(0, 2)].name)
  : prefectureShortName(r.areaName);

function assertAll47(entries: All47Entry[]) {
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
  return rows;
}

/** 47 entries with names only, for slides whose every tile is overridden (e.g. a quiz hint). */
export function prefectureEntries(): All47Entry[] {
  return Array.from({ length: 47 }, (_, i) => {
    const code = String(i + 1).padStart(2, '0');
    return { areaCode: code + '000', areaName: prefectureNameOf(code) ?? code, value: 0 };
  });
}

/** A tile drawn differently from the value colouring (e.g. a quiz hiding candidates with "?"). */
export interface TileOverride {
  fill: string;
  /** One or two centred lines; the first is the larger one when `emphasis` is set. */
  lines: string[];
  emphasis?: boolean;
}
export interface TileMapBodyOptions {
  width: number;
  height: number;
  scale?: All47Scale;
  capitalCities?: boolean;
  /** false draws prefecture names only (cover slides). Default true. */
  showValues?: boolean;
  /** Overrides the dataset-precision number (e.g. signed change "+4.1%"). */
  formatValue?: (value: number) => string;
  tileOverride?: (areaCode: string) => TileOverride | undefined;
  theme?: ChartTheme;
}

/**
 * The one tile drawing used by every 4:5 image and Instagram slide: the site layout with strait
 * rows compressed, colours from the given scale, centred labels in white or ink by contrast.
 * Returns an SVG fragment in a `width`×`height` box plus the grid geometry for placing panels.
 */
export function renderTileMapBody(entries: All47Entry[], opts: TileMapBodyOptions) {
  const rows = assertAll47(entries);
  const values = entries.map((r) => r.value);
  const lo = Math.min(...values), hi = Math.max(...values);
  const scale = opts.scale ?? defaultScale(lo, hi);
  // One precision for the whole map so 33 and 33.8 read as 33.0 and 33.8 (blog-svg-chart-standards §3).
  const precision = resolveValuePrecision(values);
  const fmt = opts.formatValue ?? ((v: number) => formatValueWithPrecision(v, precision));
  const pitch = Math.min(opts.width / IMAGE_TILE_LAYOUT.cols, opts.height / IMAGE_TILE_LAYOUT.rows);
  const left = (opts.width - IMAGE_TILE_LAYOUT.cols * pitch) / 2;
  const nameSize = Math.round(pitch * 0.27), valueSize = Math.round(pitch * 0.34);
  const showValues = opts.showValues ?? true;
  const svg = IMAGE_TILE_LAYOUT.cells.map(({ id, x, y, w, h }) => {
    const r = rows.get(id)!;
    const override = opts.tileOverride?.(r.areaCode);
    const fill = override?.fill ?? scale.colorAt(r.value), ink = textOn(fill);
    const width = w * pitch - TILE_GAP, height = h * pitch - TILE_GAP;
    const cx = width / 2, cy = height / 2;
    const lines = override?.lines ?? (showValues ? [nameOf(r, opts.capitalCities), fmt(r.value)] : [nameOf(r, opts.capitalCities)]);
    const labels = lines.length === 1
      ? text(lines[0], cx, cy + (override?.emphasis ? valueSize : nameSize) * 0.36, override?.emphasis ? valueSize * 1.3 : nameSize * 1.05, width - 8, ink, override?.emphasis ? 800 : 700, 'middle')
      : text(lines[0], cx, cy - 3, nameSize, width - 8, ink, 700, 'middle') + text(lines[1], cx, cy + valueSize - 1, valueSize, width - 8, ink, 800, 'middle');
    return `<g transform="translate(${(left + x * pitch).toFixed(1)},${(y * pitch).toFixed(1)})" data-area="${r.areaCode}" data-value="${r.value}"><rect width="${width.toFixed(1)}" height="${height.toFixed(1)}" rx="6" fill="${fill}"${outlineAttrs(opts.theme ?? LIGHT_THEME)}/>${labels}</g>`;
  }).join('');
  return { svg, pitch, left, scale, format: fmt };
}

/** The left-top panel: the top three by default, or one headline figure (e.g. the 47-prefecture total). */
export interface All47Panel {
  heading: string;
  value: string;
  caption?: string;
  valueColor?: string;
}

/** The value formatter of a whole map: one precision for every value (blog-svg-chart-standards §3). */
export function mapValueFormatter(values: number[]) {
  const precision = resolveValuePrecision(values);
  return (v: number) => formatValueWithPrecision(v, precision);
}

/** Top three (ties share a rank), shared by the tile map and the real-shape map. */
export function renderTopThree(
  entries: All47Entry[],
  opts: { x: number; top: number; width: number; rowGap: number; unit: string; format: (v: number) => string; capitalCities?: boolean; theme?: ChartTheme; heading?: string }
) {
  const { ink, muted } = opts.theme ?? LIGHT_THEME;
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  const ranked = sorted.map((r) => ({ r, rank: sorted.findIndex((o) => o.value === r.value) + 1 }));
  const top = ranked.filter(({ rank }) => rank <= TOP_PANEL.count).slice(0, TOP_PANEL.count + 1);
  const { x, unit } = opts;
  return [
    text(opts.heading ?? (opts.capitalCities ? '上位3市' : '上位3県'), x, opts.top + 24, 26, opts.width, muted, 700),
    ...top.map(({ r, rank }, i) => {
      const y = opts.top + 84 + i * opts.rowGap;
      return `<g data-top="${rank}">${text(String(rank), x + 18, y, 34, 40, muted, 700, 'middle')}${text(nameOf(r, opts.capitalCities), x + 52, y, 40, 180, ink, 700)}${text(opts.format(r.value), x + TOP_VALUE_RIGHT - 4 - widthOf(unit) * 24, y, 44, 150, ink, 800, 'end')}${text(unit, x + TOP_VALUE_RIGHT, y, 24, widthOf(unit) * 24, muted, 700, 'end')}</g>`;
    }),
  ].join('');
}

/**
 * Legend in the bottom-right corner, shared by the tile map and the real-shape map: one row per class,
 * high to low, with its colour, range and the number of prefectures (so colour is never the only cue).
 * A continuous scale has no classes and gets a gradient bar with its two ends.
 */
export function renderClassLegend(
  scale: All47Scale,
  values: number[],
  opts: { right: number; bottom: number; format: (v: number) => string; countUnit?: string; theme?: ChartTheme }
) {
  const f = opts.format;
  const theme = opts.theme ?? LIGHT_THEME;
  if (!scale.colors.length) {
    const x = opts.right - LEGEND.barWidth, y = opts.bottom - 52, steps = 60;
    const [lo, hi] = scale.boundaries;
    const bar = Array.from({ length: steps }, (_, i) => `<rect x="${(x + LEGEND.barWidth * i / steps).toFixed(1)}" y="${y}" width="${(LEGEND.barWidth / steps + 0.5).toFixed(1)}" height="${LEGEND.barHeight}" fill="${scale.colorAt(lo + (hi - lo) * i / (steps - 1))}"/>`).join('');
    return bar + text(f(lo), x, y + LEGEND.barHeight + 28, LEGEND.labelSize, 120, theme.muted, 400) + text(f(hi), opts.right, y + LEGEND.barHeight + 28, LEGEND.labelSize, 120, theme.muted, 400, 'end');
  }
  const last = scale.colors.length - 1;
  const rows = scale.colors.map((color, i) => {
    const lo = scale.boundaries[i], hi = scale.boundaries[i + 1];
    const label = scale.labelEnds === false && i === 0 ? `${f(hi)}未満`
      : scale.labelEnds === false && i === last ? `${f(lo)}以上`
      : `${f(lo)}〜${f(hi)}`;
    return { color, label, count: values.filter((v) => scale.colorAt(v) === color).length };
  }).reverse();
  const top = opts.bottom - rows.length * LEGEND.rowHeight, left = opts.right - LEGEND.width;
  return rows.map((row, i) => {
    const y = top + i * LEGEND.rowHeight;
    return `<g data-legend-row="${i}"><rect x="${left}" y="${y}" width="${LEGEND.swatch}" height="${LEGEND.swatch}" rx="4" fill="${row.color}"${outlineAttrs(theme)}/>${text(row.label, left + LEGEND.swatch + 14, y + 23, LEGEND.labelSize, LEGEND.width - LEGEND.swatch - 90, theme.ink, 400)}${text(row.count + (opts.countUnit ?? '県'), opts.right, y + 23, LEGEND.labelSize, 70, theme.ink, 700, 'end')}</g>`;
  }).join('');
}

export function renderAll47TileSvg(
  entries: All47Entry[],
  opts: All47Options
): string {
  const body = renderTileMapBody(entries, {
    width: MAP.width, height: MAP.bottom - MAP.top,
    scale: opts.scale, capitalCities: opts.capitalCities, formatValue: opts.formatValue, theme: opts.theme,
    tileOverride: opts.baseAreaCode
      ? (code) => (code === opts.baseAreaCode ? { fill: (opts.theme ?? LIGHT_THEME).wash, lines: [prefectureShortName(entries.find((e) => e.areaCode === code)!.areaName), '基準'] } : undefined)
      : undefined,
  });
  const theme = opts.theme ?? LIGHT_THEME;
  const { scale, pitch } = body;
  const left = MAP.left + body.left;
  const fmt = body.format;
  const fmtBoundary = scale.formatBoundary ?? fmt;
  const tiles = `<g transform="translate(${MAP.left},${MAP.top})">${body.svg}</g>`;

  const panelWidth = left + TOP_PANEL.colLimit * pitch - 40 - MAP.left;
  const panelTop = MAP.top + 24, rowGap = Math.min(76, (IMAGE_TILE_LAYOUT.rowAt(TOP_PANEL.rowLimit) * pitch - 90) / TOP_PANEL.count);
  const unit = opts.unit === 'l' ? 'L' : opts.unit;
  const topPanel = opts.panel
    ? [
      text(opts.panel.heading, MAP.left, panelTop + 24, 26, panelWidth, theme.muted, 700),
      `<g data-panel="headline">${text(opts.panel.value, MAP.left, panelTop + 120, 92, panelWidth, opts.panel.valueColor ?? theme.ink, 800)}</g>`,
      opts.panel.caption ? text(opts.panel.caption, MAP.left, panelTop + 176, 30, panelWidth, theme.ink, 700) : '',
    ].join('')
    : renderTopThree(entries, { x: MAP.left, top: panelTop, width: panelWidth, rowGap, unit, format: fmt, capitalCities: opts.capitalCities, theme });
  const legend = renderClassLegend(scale, entries.filter((r) => r.areaCode !== opts.baseAreaCode).map((r) => r.value), { right: MAP.left + MAP.width, bottom: MAP.bottom - 12, format: fmtBoundary, countUnit: opts.capitalCities ? '市' : '県', theme });

  // Minimal copy (chart-image-copy.md): metric, year, unit, the city/prefecture scope, legend and source.
  // No publisher, slogans or how-to-read notes; those belong to the post text.
  // State the capital-city scope once; skip it here when the definition line already says so.
  const scope = opts.capitalCities && !/県庁所在市/.test(opts.note ?? '') ? ' · 県庁所在市' : '';
  // A lowercase l reads as 1 at phone width; show the litre symbol as L.
  const meta = `${opts.year} · 単位：${unit}${scope}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" data-image-template="tile-map" data-theme="${theme.name}"><rect width="1080" height="1350" fill="${theme.paper}"/><g font-family="'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',Meiryo,sans-serif">
    ${text(opts.title, 64, 120, 72, 952, theme.ink)}${text(meta, 64, 184, 32, 952, theme.muted, 400)}
    ${opts.note ? text(opts.note, 64, 230, 28, 952, theme.muted, 400) : ''}
    ${topPanel}
    ${tiles}
    ${legend}
    ${opts.source ? text('出典：' + opts.source, 64, 1310, 26, 952, theme.muted, 400) : ''}
  </g></svg>`;
}
