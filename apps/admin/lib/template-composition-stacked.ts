import { z } from 'zod';
import { SERIES_COLORS } from '../../../packages/svg-builder/src/shared/color';
import { BRAND } from '../../web/src/features/ogp/brand';
import type { StatsSchema } from '../../../packages/types/src';
import { SAMPLE_FRAME, escapeXml, sampleBodyTop, sampleFrame } from './template-sample-frame';

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

/**
 * 100% bars drawn at frame size: one bar per fiscal year, each share inside its segment when it fits,
 * and one legend for the categories (no per-bar lists repeating the legend).
 */
export function renderCompositionStacked(raw: unknown) {
  const rows = compositionSampleRows(raw);
  const categories = [...new Set(rows.map((row) => row.areaName))];
  const top = sampleBodyTop(false) + 40;
  const bar = { left: 220, right: SAMPLE_FRAME.right, height: 150, gap: 70 };
  const width = bar.right - bar.left;
  const bars = YEARS.map((year, yi) => {
    const values = categories.map((name) => rows.find((row) => row.areaName === name && row.yearCode === year)!.value ?? 0);
    const total = values.reduce((a, b) => a + b, 0);
    const y = top + yi * (bar.height + bar.gap);
    let x = bar.left;
    const segments = values.map((value, ci) => {
      const w = width * value / total, share = (value / total * 100).toFixed(1) + '%';
      const fill = SERIES_COLORS[ci % SERIES_COLORS.length];
      const rect = `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${bar.height}" fill="${fill}"/>`;
      const text = w >= MIN_LABEL_WIDTH ? `<text x="${(x + w / 2).toFixed(1)}" y="${y + bar.height / 2 + 12}" text-anchor="middle" font-size="${w >= 110 ? 32 : 26}" font-weight="700" fill="${labelColor(fill)}">${share}</text>` : '';
      x += w;
      return rect + text;
    }).join('');
    return `<g data-year="${year}"><text x="${SAMPLE_FRAME.left}" y="${y + bar.height / 2 + 12}" font-size="30" font-weight="700">${year}</text>${segments}</g>`;
  }).join('');
  const legendTop = top + YEARS.length * (bar.height + bar.gap) + 10, column = (SAMPLE_FRAME.right - SAMPLE_FRAME.left) / 2;
  const legend = categories.map((name, ci) => {
    const x = SAMPLE_FRAME.left + (ci % 2) * column, y = legendTop + Math.floor(ci / 2) * 64;
    return `<rect x="${x}" y="${y}" width="34" height="34" rx="4" fill="${SERIES_COLORS[ci % SERIES_COLORS.length]}"/><text x="${x + 50}" y="${y + 28}" font-size="28" fill="${BRAND.ink}">${escapeXml(name)}</text>`;
  }).join('');
  return sampleFrame({
    title: '酒類別の販売数量構成比', titleSize: 64, meta: '2008・2013・2018年度 · 全国 · 単位：%', source: '国税庁「酒のしおり」',
    body: bars + legend,
  });
}
