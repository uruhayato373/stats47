import { z } from 'zod';
import { BRAND } from '../../web/src/features/ogp/brand';
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
export const escapeXml = (text: string) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

/** One common frame for the four media; the complete 47-prefecture input stays in R2. */
export function renderRankingBars(raw: unknown, presentation: MetricPresentation = RANKING_SAMPLE_METRIC.visualization) {
  const allRows = rankingRows(raw);
  const rows = { top: allRows.slice(0, 5), bottom: allRows.slice(-5) };
  const axis = rankingBarAxis(allRows.map((row) => row.value), presentation);
  const label = rankingSampleLabels();
  const plot = { left: 352, width: 536 };
  const xAt = (value: number) => plot.left + plot.width * (value - axis.min) / (axis.max - axis.min);
  const group = (data: typeof rows.top, title: string, y: number) => `
    <text x="64" y="${y}" font-size="36" font-weight="700">${title}</text>
    ${data.map((r, i) => {
      const baseline = y + 80 + i * 64;
      const origin = xAt(axis.baseline), end = xAt(r.value);
      const marker = axis.truncated && Math.abs(end - origin) < 0.5 ? `<circle cx="${end}" cy="${baseline - 10}" r="4" fill="${BRAND.primary}"/>` : '';
      return `<g data-rank="${r.rank}" data-value="${r.value}"><text x="96" y="${baseline}" text-anchor="end" font-size="30" fill="${BRAND.muted}">${r.rank}</text><text x="128" y="${baseline}" font-size="42" font-weight="600">${escapeXml(r.area_name)}</text><rect data-bar-track="true" x="${plot.left}" y="${baseline - 27}" width="${plot.width}" height="34" rx="6" fill="${BRAND.wash}"/><rect data-bar-value="true" x="${Math.min(origin, end)}" y="${baseline - 27}" width="${Math.abs(end - origin)}" height="34" rx="6" fill="${BRAND.primary}"/>${marker}<text x="1016" y="${baseline}" text-anchor="end" font-size="42" font-weight="700" fill="${BRAND.primary}">${label.formatValue(r.value)}</text></g>`;
    }).join('')}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" data-domain-min="${axis.min}" data-domain-max="${axis.max}" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${BRAND.paper}"/><g font-family="Noto Sans JP, Yu Gothic, Meiryo, sans-serif" fill="${BRAND.ink}"><text x="64" y="86" font-size="42" font-weight="700">stats47</text><text x="64" y="184" font-size="72" font-weight="700">${escapeXml(label.title)}</text><text x="64" y="246" font-size="32" fill="${BRAND.muted}">${RANKING_SAMPLE_YEAR}年 · 単位：${escapeXml(label.unit)}${axis.truncated ? ` · 範囲：${label.formatValue(axis.min)}–${label.formatValue(axis.max)}` : ''}</text><text x="64" y="292" font-size="28" fill="${BRAND.muted}">${escapeXml(label.subtitle)}</text>${group(rows.top, '上位5県', 350)}${group(rows.bottom, '下位5県', 760)}<line x1="64" x2="1016" y1="1190" y2="1190" stroke="${BRAND.line}"/><text x="64" y="1235" font-size="28" fill="${BRAND.muted}">出典：${escapeXml(label.source)}</text></g></svg>`;
}
