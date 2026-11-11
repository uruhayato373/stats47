import type { MetricPresentation } from '@stats47/types';
import { BRAND } from '../../web/src/features/ogp/brand';
import { LIGHT_THEME, mixColor, toHex, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { resolveMetricColor } from '../../remotion/src/features/data-cards/tile-scale';
import { labelColor } from './template-composition-stacked';
import { SAMPLE_FRAME, escapeXml, fitTitleSize, sampleBodyTop, sampleFrame, textWidth } from './template-sample-frame';

/**
 * The treemap type (image-templates.json `treemap`): one whole split into rectangles whose areas are
 * proportional to the parts. For a breakdown with too many parts for a stacked bar, such as the 54
 * municipalities of one prefecture. Parts at or below zero have no area and are refused, so the caller
 * states what it left out instead of the image hiding it.
 */
export interface TreemapChart {
  title: string;
  meta: string;
  note?: string;
  source: string;
  /** The metric's colour policy; one colour (resolveMetricColor), larger shares drawn darker. */
  presentation: MetricPresentation;
  items: { label: string; value: number }[];
  ariaLabel?: string;
}

export interface TreemapRect { label: string; value: number; x: number; y: number; w: number; h: number }

/** The worst aspect ratio of a strip laid along a side (the squarify criterion). */
function worstRatio(areas: number[], side: number) {
  const sum = areas.reduce((s, a) => s + a, 0);
  return Math.max(side * side * Math.max(...areas) / (sum * sum), sum * sum / (side * side * Math.min(...areas)));
}

/**
 * Areas proportional to values, largest first: parts join the current strip along the shorter side
 * while that does not worsen the strip's aspect ratio. The rectangles exactly tile width × height.
 */
export function squarify(items: { label: string; value: number }[], width: number, height: number): TreemapRect[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, item) => s + item.value, 0);
  const scale = width * height / total;
  const rects: TreemapRect[] = [];
  let x = 0, y = 0, w = width, h = height;
  const place = (strip: typeof sorted) => {
    const areas = strip.map((item) => item.value * scale);
    const sum = areas.reduce((s, a) => s + a, 0);
    const vertical = w >= h;
    const thick = vertical ? sum / h : sum / w;
    let along = vertical ? y : x;
    strip.forEach((item, i) => {
      const len = areas[i] / thick;
      rects.push(vertical ? { ...item, x, y: along, w: thick, h: len } : { ...item, x: along, y, w: len, h: thick });
      along += len;
    });
    if (vertical) { x += thick; w -= thick; } else { y += thick; h -= thick; }
  };
  let strip: typeof sorted = [];
  for (const item of sorted) {
    const side = Math.min(w, h);
    const current = strip.map((s) => s.value * scale);
    if (strip.length === 0 || worstRatio([...current, item.value * scale], side) <= worstRatio(current, side)) strip.push(item);
    else { place(strip); strip = [item]; }
  }
  if (strip.length) place(strip);
  return rects;
}

// Share bands: the largest parts in the full metric colour, small parts close to the paper.
const SHARE_BANDS = [[0.2, 0], [0.05, 0.3], [0.02, 0.55], [0, 0.75]] as const;
const LABEL_MAX = 56;
const LABEL_MIN = 22;
const SHARE_RATIO = 0.8;
const INSET = 12;

export function renderTreemapChart(chart: TreemapChart, theme: ChartTheme = LIGHT_THEME) {
  if (chart.items.length < 2) throw Error('ツリーマップには 2 つ以上の項目が要ります。');
  const bad = chart.items.filter((item) => !Number.isFinite(item.value) || item.value <= 0);
  if (bad.length) throw Error(`面積にできない値の項目: ${bad.map((item) => item.label).join(' ')}`);
  if (new Set(chart.items.map((item) => item.label)).size !== chart.items.length) throw Error('ツリーマップの項目名が重複しています。');
  const top = sampleBodyTop(Boolean(chart.note)) + 16;
  const left = SAMPLE_FRAME.left;
  const width = SAMPLE_FRAME.right - left, height = SAMPLE_FRAME.bodyBottom - top;
  const total = chart.items.reduce((s, item) => s + item.value, 0);
  const color = toHex(resolveMetricColor(chart.presentation) ?? BRAND.primary);
  const cells = squarify(chart.items, width, height).map((r) => {
    const share = r.value / total;
    const fill = mixColor(color, theme.paper, SHARE_BANDS.find(([floor]) => share >= floor)![1]);
    const x = left + r.x, y = top + r.y;
    const rect = `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" fill="${fill}" stroke="${theme.paper}" stroke-width="3"/>`;
    const pct = (share * 100).toFixed(1) + '%';
    const ink = labelColor(fill);
    // The name and its share only where both fit inside the rectangle; small parts stay unnamed.
    for (let size = Math.min(LABEL_MAX, Math.floor(Math.sqrt(r.w * r.h) / 6)); size >= LABEL_MIN; size -= 2) {
      const fits = Math.max(textWidth(r.label, size), textWidth(pct, size * SHARE_RATIO)) + INSET * 2 <= r.w && size * (1 + SHARE_RATIO) + INSET * 3 <= r.h;
      if (!fits) continue;
      return `<g data-part="${escapeXml(r.label)}" data-value="${r.value}">${rect}<text x="${(x + INSET).toFixed(1)}" y="${(y + INSET + size * 0.9).toFixed(1)}" font-size="${size}" font-weight="700" fill="${ink}">${escapeXml(r.label)}</text><text x="${(x + INSET).toFixed(1)}" y="${(y + INSET * 2 + size * (0.9 + SHARE_RATIO)).toFixed(1)}" font-size="${Math.round(size * SHARE_RATIO)}" fill="${ink}">${pct}</text></g>`;
    }
    return `<g data-part="${escapeXml(r.label)}" data-value="${r.value}">${rect}</g>`;
  }).join('');
  return sampleFrame({
    title: chart.title, titleSize: fitTitleSize(chart.title, 64), meta: chart.meta, note: chart.note, source: chart.source,
    ariaLabel: chart.ariaLabel, attributes: `data-image-template="treemap" data-parts="${chart.items.length}"`,
    body: cells, theme,
  });
}
