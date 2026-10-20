import { z } from 'zod';
import { generateStackedBarSvg } from '../../../packages/svg-builder/src/charts/stacked-bar';
import type { StatsSchema } from '../../../packages/types/src';
import { BRAND } from '../../web/src/features/ogp/brand';

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

export function renderCompositionStacked(raw: unknown) {
  const chart = generateStackedBarSvg(compositionSampleRows(raw), {
    title: '酒類別の販売数量構成比', xKey: 'yearCode', seriesKey: 'areaCode',
    normalized: true, horizontal: true, width: 340, showHeading: false,
  });
  const viewBox = /viewBox="([^"]+)"/.exec(chart)![1];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" role="img" aria-label="酒類別の販売数量構成比">
    <rect width="1080" height="1350" fill="${BRAND.paper}"/>
    <g font-family="Noto Sans JP, Yu Gothic, Meiryo, sans-serif" fill="${BRAND.ink}">
      <text x="64" y="86" font-size="42" font-weight="700">stats47</text>
      <text x="64" y="184" font-size="64" font-weight="700">酒類別の販売数量構成比</text>
      <text x="64" y="246" font-size="32" fill="${BRAND.muted}">2008・2013・2018年度 · 全国</text>
      <svg x="64" y="350" width="952" height="812" viewBox="${viewBox}">${chart}</svg>
      <line x1="64" x2="1016" y1="1190" y2="1190" stroke="${BRAND.line}"/>
      <text x="64" y="1235" font-size="28" fill="${BRAND.muted}">出典：国税庁「酒のしおり」</text>
    </g></svg>`;
}
