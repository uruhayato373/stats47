import { z } from 'zod';
import { BRAND } from '../../web/src/features/ogp/brand';
import { SAMPLE_FRAME, escapeXml, sampleBodyTop, sampleFrame } from './template-sample-frame';
import { RANKING_SAMPLE_METRIC, RANKING_SAMPLE_YEAR, rankingBarAxis, rankingSampleLabels } from './template-ranking-data';
import type { MetricPresentation } from '../../../packages/types/src/metric-presentation';

export const RANKING_BAR_SAMPLE_ID = 'maximum-temperature-bars';
export const RANKING_BAR_FRAME = { width: 1080, height: 1350 } as const;
const rowSchema = z.object({
  rank: z.number().int().min(1).max(47),
  area_code: z.string().regex(/^\d{2}000$/),
  area_name: z.string().min(1).max(10),
  year: z.literal(RANKING_SAMPLE_YEAR),
  value: z.number().finite(),
});
const inputSchema = z.object({
  _meta: z.object({ rankingKey: z.literal(RANKING_SAMPLE_METRIC.key), year: z.literal(Number(RANKING_SAMPLE_YEAR)) }),
  unit: z.literal(RANKING_SAMPLE_METRIC.unit),
  data: z.array(rowSchema).length(47),
}).superRefine(({ data }, ctx) => {
  const sorted = [...data].sort((a, b) => a.rank - b.rank);
  if (new Set(data.map((r) => r.area_code)).size !== 47 ||
      sorted.some((r, i) => r.rank !== sorted.findIndex((other) => other.value === r.value) + 1 ||
        Number(r.area_code.slice(0, 2)) < 1 || Number(r.area_code.slice(0, 2)) > 47 ||
        (i > 0 && r.value > sorted[i - 1].value)))
    ctx.addIssue({ code: 'custom', message: '47都道府県の順位と値の順序を確認してください。' });
});
export function rankingRows(raw: unknown) {
  const input = inputSchema.parse(raw);
  return [...input.data].sort((a, b) => a.rank - b.rank);
}
export function rankingBarRows(raw: unknown) {
  const rows = rankingRows(raw);
  return { top: rows.slice(0, 5), bottom: rows.slice(-5) };
}

/** One common frame for the four media; the complete 47-prefecture input stays in R2. */
export function renderRankingBars(raw: unknown, presentation: MetricPresentation = RANKING_SAMPLE_METRIC.visualization) {
  const allRows = rankingRows(raw);
  const rows = { top: allRows.slice(0, 5), bottom: allRows.slice(-5) };
  const axis = rankingBarAxis(allRows.map((row) => row.value), presentation);
  const label = rankingSampleLabels();
  const plot = { left: 352, width: 536 };
  const rowGap = 80;
  const top = sampleBodyTop(Boolean(label.subtitle)) + 44;
  const groupGap = (SAMPLE_FRAME.bodyBottom - top) / 2;
  const xAt = (value: number) => plot.left + plot.width * (value - axis.min) / (axis.max - axis.min);
  const group = (data: typeof rows.top, title: string, y: number) => `
    <text x="64" y="${y}" font-size="36" font-weight="700">${title}</text>
    ${data.map((r, i) => {
      const baseline = y + 84 + i * rowGap;
      const origin = xAt(axis.baseline), end = xAt(r.value);
      const marker = axis.truncated && Math.abs(end - origin) < 0.5 ? `<circle cx="${end}" cy="${baseline - 12}" r="5" fill="${BRAND.primary}"/>` : '';
      return `<g data-rank="${r.rank}" data-value="${r.value}"><text x="96" y="${baseline}" text-anchor="end" font-size="30" fill="${BRAND.muted}">${r.rank}</text><text x="128" y="${baseline}" font-size="44" font-weight="600">${escapeXml(r.area_name)}</text><rect data-bar-track="true" x="${plot.left}" y="${baseline - 32}" width="${plot.width}" height="42" rx="6" fill="${BRAND.wash}"/><rect data-bar-value="true" x="${Math.min(origin, end)}" y="${baseline - 32}" width="${Math.abs(end - origin)}" height="42" rx="6" fill="${BRAND.primary}"/>${marker}<text x="1016" y="${baseline}" text-anchor="end" font-size="44" font-weight="700" fill="${BRAND.primary}">${label.formatValue(r.value)}</text></g>`;
    }).join('')}`;
  return sampleFrame({
    title: label.title,
    meta: `${RANKING_SAMPLE_YEAR}年 · 単位：${label.unit}${axis.truncated ? ` · 範囲：${label.formatValue(axis.min)}–${label.formatValue(axis.max)}` : ''}`,
    note: label.subtitle || undefined,
    source: label.source,
    attributes: `data-domain-min="${axis.min}" data-domain-max="${axis.max}"`,
    body: group(rows.top, '上位5県', top) + group(rows.bottom, '下位5県', top + groupGap),
  });
}
