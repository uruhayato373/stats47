import { z } from 'zod';
import { SERIES_COLORS } from '../../../packages/svg-builder/src/shared/color';
import { BRAND } from '../../web/src/features/ogp/brand';
import type { StatsSchema } from '../../../packages/types/src';
import { LIGHT_THEME, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { SAMPLE_FRAME, escapeXml, fitTitleSize, sampleBodyTop, sampleFrame, textWidth } from './template-sample-frame';

export const COMPOSITION_SAMPLE_SOURCE = {
  bucket: 'stats47',
  key: 'app/blog/alcohol-prefecture-map/data/liquor-type-breakdown.json',
  sha256: '9b87f154b1a79c3cc9edc2c7373e890a935d7107224f5c47824d84e610c02aac',
  bytes: 2657,
} as const;
export const COMPOSITION_SAMPLE_PROVENANCE = {
  bucket: 'stats47',
  key: 'app/blog/alcohol-prefecture-map/data/liquor-type-breakdown.source.json',
  sha256: '88618a62cb6681ee6232a5bff7686be8f309485d48fb12f1da122530d0d694f9',
  bytes: 1453,
} as const;
const YEARS = ['2008年度', '2013年度', '2018年度'] as const;
const schema = z.object({
  title: z.string(),
  unit: z.literal('%'),
  valueUnit: z.literal('千kL'),
  normalized: z.literal(true),
  series: z.array(z.object({
    label: z.string().min(1),
    data: z.array(z.object({
      year: z.enum(YEARS),
      value: z.number().finite().nonnegative(),
    })).length(3),
  })).length(8),
});

/** Preserve the published input's eight categories and three fiscal years. */
export function compositionSampleRows(raw: unknown): StatsSchema[] {
  const input = schema.parse(raw);
  if (new Set(input.series.map(s => s.label)).size !== 8 ||
    input.series.some(s => new Set(s.data.map(d => d.year)).size !== 3))
    throw Error('酒類見本の区分・年度が重複しています。');
  if (YEARS.some(year => input.series.reduce((sum, s) =>
    sum + s.data.find(d => d.year === year)!.value, 0) <= 0))
    throw Error('酒類見本の年度合計が0です。');
  return input.series.flatMap((series, i) => YEARS.map(year => ({
    metricKey: 'liquor-sales-composition',
    areaCode: String(i), areaName: series.label,
    yearCode: year, yearName: year,
    value: series.data.find(d => d.year === year)!.value, unit: input.valueUnit,
  })));
}

// A share is written inside its segment only when the segment is wide enough to hold it.
const MIN_LABEL_WIDTH = 72;
/** White or ink on a segment, by relative luminance of the fill. */
function labelColor(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Whichever of white and ink contrasts more with the fill (as on the tile map); ink luminance is about 0.02.
  return 1.05 / (l + 0.05) > (l + 0.05) / 0.07 ? '#FFFFFF' : BRAND.ink;
}

/** One stacked bar per group; each category has one value per group, null when not observed. */
export interface StackedChart {
  title: string;
  meta: string;
  note?: string;
  source: string;
  /** The bars' names, top to bottom. */
  groups: string[];
  categories: { label: string; values: (number | null)[] }[];
  /** True: each bar is 100% and segments show shares. False: bars keep their totals and segments show values. */
  normalized: boolean;
  unit: string;
  decimals?: number;
}

const BAR_MAX_HEIGHT = 150;
const BAR_GAP_RATIO = 0.4;
const LEGEND_ROW = 58;

/**
 * Stacked bars drawn at frame size: each value inside its segment when it fits, and one legend for the
 * categories (no per-bar lists repeating the legend).
 */
export function renderStackedChart(chart: StackedChart, theme: ChartTheme = LIGHT_THEME) {
  const { groups, categories, normalized } = chart;
  const totals = groups.map((_, g) => categories.reduce((sum, c) => sum + Math.max(0, c.values[g] ?? 0), 0));
  const largest = Math.max(...totals);
  if (!(largest > 0)) throw Error('積み上げ棒の合計が0です。');
  const decimals = chart.decimals ?? 1;
  const top = sampleBodyTop(Boolean(chart.note)) + 40;
  // Legend at the bottom, in two columns unless a name would not fit half the frame.
  const frameWidth = SAMPLE_FRAME.right - SAMPLE_FRAME.left;
  const columns = categories.some((c) => 50 + textWidth(c.label, 28) > frameWidth / 2 - 16) ? 1 : 2;
  const legendRows = Math.ceil(categories.length / columns);
  const legendTop = SAMPLE_FRAME.bodyBottom - legendRows * LEGEND_ROW + 20;
  const available = legendTop - 40 - top;
  const height = Math.min(BAR_MAX_HEIGHT, available / (groups.length + (groups.length - 1) * BAR_GAP_RATIO));
  const gap = groups.length > 1 ? Math.min(70, (available - height * groups.length) / (groups.length - 1)) : 0;
  const nameSize = height >= 60 ? 30 : 26;
  const left = SAMPLE_FRAME.left + Math.min(320, Math.max(...groups.map((g) => textWidth(g, nameSize)))) + 24;
  const width = SAMPLE_FRAME.right - left;
  const bars = groups.map((group, g) => {
    const y = top + g * (height + gap);
    let x = left;
    const segments = categories.map((category, c) => {
      const value = Math.max(0, category.values[g] ?? 0);
      const w = width * value / (normalized ? totals[g] || 1 : largest);
      const label = normalized ? (value / (totals[g] || 1) * 100).toFixed(1) + '%' : value.toLocaleString('en-US', { maximumFractionDigits: decimals });
      const fill = SERIES_COLORS[c % SERIES_COLORS.length];
      const size = w >= 110 ? 32 : 26;
      const rect = `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${height.toFixed(1)}" fill="${fill}"/>`;
      const text = w >= Math.max(MIN_LABEL_WIDTH, textWidth(label, size) + 8) && height >= 40 ? `<text x="${(x + w / 2).toFixed(1)}" y="${(y + height / 2 + 11).toFixed(1)}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${labelColor(fill)}">${label}</text>` : '';
      x += w;
      return rect + text;
    }).join('');
    return `<g data-group="${escapeXml(group)}" data-total="${totals[g]}"><text x="${SAMPLE_FRAME.left}" y="${(y + height / 2 + 11).toFixed(1)}" font-size="${nameSize}" font-weight="700">${escapeXml(group)}</text>${segments}</g>`;
  }).join('');
  const column = frameWidth / columns;
  const legend = categories.map((category, c) => {
    const x = SAMPLE_FRAME.left + (c % columns) * column, y = legendTop + Math.floor(c / columns) * LEGEND_ROW;
    return `<rect x="${x}" y="${y}" width="34" height="34" rx="4" fill="${SERIES_COLORS[c % SERIES_COLORS.length]}"/><text x="${x + 50}" y="${y + 28}" font-size="28" fill="${theme.ink}">${escapeXml(category.label)}</text>`;
  }).join('');
  return sampleFrame({
    title: chart.title, titleSize: fitTitleSize(chart.title, 64), meta: chart.meta, note: chart.note, source: chart.source,
    attributes: `data-image-template="stacked-bar" data-normalized="${normalized}"`,
    body: bars + legend,
    theme,
  });
}

/** The fixed liquor sample: 100% bars per fiscal year. */
export function renderCompositionStacked(raw: unknown) {
  const rows = compositionSampleRows(raw);
  const labels = [...new Set(rows.map((row) => row.areaName))];
  return renderStackedChart({
    title: '酒類別の販売数量構成比', meta: '2008・2013・2018年度 · 全国 · 単位：%', source: '国税庁「酒のしおり」',
    groups: [...YEARS],
    categories: labels.map((label) => ({ label, values: YEARS.map((year) => rows.find((row) => row.areaName === label && row.yearCode === year)!.value) })),
    normalized: true, unit: '%',
  });
}
