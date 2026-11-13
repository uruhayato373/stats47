import { z } from 'zod';
import { BRAND } from '../../web/src/features/ogp/brand';
import { SAMPLE_FRAME, escapeXml, fitTitleSize, sampleBodyTop, sampleFrame } from './template-sample-frame';
import { RANKING_SAMPLE_METRIC, RANKING_SAMPLE_PRESENTATION, RANKING_SAMPLE_YEAR, assertRankingRows, isCapitalCityChart, rankingBarAxis, sampleRankingChart, type ItemBarChart, type RankingChart } from './template-ranking-data';
import { capitalCityName } from '../../remotion/src/features/data-cards/all47-svg';
import type { MetricPresentation } from '../../../packages/types/src/metric-presentation';
import { scopeAttributes, type AreaChart } from './template-area-scope';
import { resolveMetricColor } from '../../remotion/src/features/data-cards/tile-scale';
import { LIGHT_THEME, mixColor, outlineAttrs, toHex, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';

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

// Card rows: a coloured heading band per group, a rank badge, the name with its value at the right and
// a thin bar under the name. Kept from the earlier blog ranking cards, coloured by the metric.
export const RANKING_BAR_PLOT = { left: 196, right: SAMPLE_FRAME.right - 24 } as const;
const CARD = { band: 60, rowHeight: 84, bandGap: 10, radius: 14, badge: 27 } as const;
/** The rank's size in its badge: 30 and 26 as before for one and two digits, smaller for three or more so the number stays inside the circle (a municipal set reaches four digits). */
const BADGE_TEXT_WIDTH = CARD.badge * 2 - 8;
const DIGIT_WIDTH = 0.6;
export const rankBadgeFontSize = (rank: number) => {
  const digits = String(rank).length;
  return digits === 1 ? 30 : Math.min(26, Math.floor(BADGE_TEXT_WIDTH / (digits * DIGIT_WIDTH)));
};
const ITEM_ROWS_MAX = 10;
const ITEM_ROW_MAX = 150;

/** One common frame for the four media; the complete 47-prefecture input stays in R2. */
export function renderRankingBars(raw: unknown, presentation: MetricPresentation = RANKING_SAMPLE_PRESENTATION, theme: ChartTheme = LIGHT_THEME) {
  return renderRankingBarsChart(sampleRankingChart({ data: rankingRows(raw) }, presentation), theme);
}

/** Upper and lower five of any complete ranking, in the metric's colour (lower five in its lighter tint). */
export function renderRankingBarsChart(chart: RankingChart, theme: ChartTheme = LIGHT_THEME) {
  const rows = assertRankingRows(chart.rows);
  // Capital-city values (家計調査) name the same cities as the tile map, not the prefectures.
  if (isCapitalCityChart(chart)) {
    const cities = rows.map((row) => ({ ...row, area_name: capitalCityName(row.area_code) }));
    return drawBars(chart, cities, theme, { title: chart.title + 'ランキング', upper: '上位5市', lower: '下位5市' });
  }
  return drawBars(chart, rows, theme, { title: chart.title + 'ランキング', upper: '上位5県', lower: '下位5県' });
}

/** The same cards for a scope's areas (resolveAreaChart): one bar type, whatever the set. */
export function renderAreaBarsChart(chart: AreaChart, theme: ChartTheme = LIGHT_THEME) {
  if (chart.rows.length < 2) throw new Error('棒グラフには 2 つ以上の地域が要ります。');
  return drawBars(chart, chart.rows, theme, { title: chart.title, upper: '上位', lower: '下位', attributes: scopeAttributes(chart.scope) });
}

const metaLine = (chart: { yearLabel: string; unit: string; formatValue: (value: number) => string }, axis: { truncated: boolean; min: number; max: number }) =>
  [chart.yearLabel, chart.unit && `単位：${chart.unit}`, axis.truncated && `範囲：${chart.formatValue(axis.min)}–${chart.formatValue(axis.max)}`].filter(Boolean).join(' · ');

/**
 * A set of rows that is not a full ranking. Up to ten rows all show, in the author's order and without ranks;
 * beyond that the same upper and lower cards, with ranks counted inside the set.
 */
export function renderItemBarsChart(chart: ItemBarChart, theme: ChartTheme = LIGHT_THEME) {
  if (chart.rows.length > ITEM_ROWS_MAX) {
    const sorted = [...chart.rows].sort((a, b) => b.value - a.value);
    const rows = sorted.map((row) => ({ rank: sorted.findIndex((other) => other.value === row.value) + 1, area_code: '', area_name: row.name, value: row.value }));
    return drawBars({ ...chart, rows }, rows, theme, { title: chart.title, upper: '上位', lower: '下位', attributes: 'data-items="true"' });
  }
  // These rows compare amounts, so bars start at zero whatever range a ranking metric would use.
  const values = chart.rows.map((row) => row.value);
  const axis = { min: Math.min(0, ...values), max: Math.max(0, ...values), baseline: 0, truncated: false };
  const colors = barColors(chart, theme);
  const left = SAMPLE_FRAME.left, width = SAMPLE_FRAME.right - left;
  const top = sampleBodyTop(Boolean(chart.note)) + 8;
  const rowHeight = Math.min(ITEM_ROW_MAX, (SAMPLE_FRAME.bodyBottom - top) / chart.rows.length);
  const plot = { left: left + 28, right: SAMPLE_FRAME.right - 28 };
  const xAt = (value: number) => plot.left + (plot.right - plot.left) * (value - axis.min) / (axis.max - axis.min);
  const signed = axis.min < 0 && axis.max > 0;
  const rows = chart.rows.map((row, i) => {
    const y = top + i * rowHeight, barY = y + rowHeight - 34;
    const origin = xAt(axis.baseline), end = xAt(row.value);
    const valueText = `${chart.formatValue(row.value)}<tspan font-size="26" dx="4">${escapeXml(chart.unit)}</tspan>`;
    const wash = i % 2 === 0 ? `<rect x="${left}" y="${y}" width="${width}" height="${rowHeight - 6}" rx="${CARD.radius}" fill="${colors.rowWash}"${outlineAttrs(theme)}/>` : '';
    return `<g data-value="${row.value}">${wash}<text x="${plot.left}" y="${barY - 16}" font-size="36" font-weight="700" fill="${theme.ink}">${escapeXml(row.name)}</text><text x="${plot.right}" y="${barY - 16}" text-anchor="end" font-size="40" font-weight="700" fill="${colors.valueInk}">${valueText}</text><rect data-bar-track="true" x="${plot.left}" y="${barY}" width="${plot.right - plot.left}" height="10" rx="5" fill="${colors.track}"/><rect data-bar-value="true" x="${Math.min(origin, end)}" y="${barY}" width="${Math.abs(end - origin)}" height="10" rx="5" fill="${colors.barOn(colors.color)}"/>${signed ? `<line x1="${origin}" y1="${barY - 5}" x2="${origin}" y2="${barY + 15}" stroke="${theme.ink}" stroke-width="2"/>` : ''}</g>`;
  }).join('');
  return sampleFrame({
    title: chart.title, titleSize: fitTitleSize(chart.title), meta: metaLine(chart, axis), note: chart.note, source: chart.source,
    attributes: `data-image-template="bar" data-items="true" data-domain-min="${axis.min}" data-domain-max="${axis.max}"`,
    body: rows, theme,
  });
}

/** The colours of a bar image, all from the metric's own colour. */
function barColors(chart: { presentation: MetricPresentation }, theme: ChartTheme) {
  const dark = theme.name === 'dark';
  // The metric's own colour (strong end of its scheme), so its bars and its map share one hue.
  const color = toHex(resolveMetricColor(chart.presentation) ?? BRAND.primary);
  const card = dark ? theme.paper : '#FFFFFF';
  return {
    color, card,
    // The lower five in a lighter tint: toward white in both themes so it reads apart from the upper band.
    lower: mixColor(color, '#FFFFFF', dark ? 0.3 : 0.38),
    rowWash: mixColor(color, card, dark ? 0.82 : 0.9),
    track: mixColor(color, card, dark ? 0.7 : 0.8),
    // The strong colour is too dark to read as text on the dark paper.
    valueInk: dark ? mixColor(color, '#FFFFFF', 0.65) : color,
    // Dark ranks and bars on the dark rows sit too close in lightness: lift them as the paper lifts the maps.
    barOn: (fill: string) => (dark ? mixColor(fill, '#FFFFFF', 0.3) : fill),
  };
}

function drawBars(chart: RankingChart, allRows: RankingChart['rows'], theme: ChartTheme, labels: { title: string; upper: string; lower: string; attributes?: string }) {
  // Five each, or half each when there are fewer than ten rows.
  const each = Math.min(5, Math.floor(allRows.length / 2));
  const rows = { top: allRows.slice(0, each), bottom: allRows.slice(-each) };
  const axis = rankingBarAxis(allRows.map((row) => row.value), chart.presentation);
  const dark = theme.name === 'dark';
  const { color, card, lower, rowWash, track, valueInk, barOn } = barColors(chart, theme);
  const left = SAMPLE_FRAME.left, width = SAMPLE_FRAME.right - left;
  const plotWidth = RANKING_BAR_PLOT.right - RANKING_BAR_PLOT.left;
  const top = sampleBodyTop(Boolean(chart.note)) + 8;
  const groupHeight = CARD.band + CARD.bandGap + CARD.rowHeight * 5;
  const groupGap = SAMPLE_FRAME.bodyBottom - top - groupHeight * 2;
  const signed = axis.min < 0 && axis.max > 0;
  const xAt = (value: number) => RANKING_BAR_PLOT.left + plotWidth * (value - axis.min) / (axis.max - axis.min);
  const unit = escapeXml(chart.unit);
  const group = (data: typeof rows.top, title: string, y: number, fill: string) => `
    <rect x="${left}" y="${y}" width="${width}" height="${CARD.band}" rx="${CARD.radius}" fill="${fill}"/>
    <text x="${left + 28}" y="${y + 41}" font-size="32" font-weight="700" fill="#FFFFFF">${title}</text>
    ${data.map((r, i) => {
      const rowTop = y + CARD.band + CARD.bandGap + i * CARD.rowHeight;
      const rowFill = i % 2 === 0 ? rowWash : dark ? card : '';
      const barY = rowTop + 56, origin = xAt(axis.baseline), end = xAt(r.value);
      const marker = axis.truncated && Math.abs(end - origin) < 0.5 ? `<circle cx="${end}" cy="${barY + 5}" r="6" fill="${fill}"/>` : '';
      return `<g data-rank="${r.rank}" data-value="${r.value}">${rowFill ? `<rect x="${left}" y="${rowTop}" width="${width}" height="${CARD.rowHeight - 6}" rx="${CARD.radius}" fill="${rowFill}"${outlineAttrs(theme)}/>` : ''}<circle cx="${left + 52}" cy="${rowTop + 39}" r="${CARD.badge}" fill="${fill}"/><text x="${left + 52}" y="${rowTop + 49}" text-anchor="middle" font-size="${rankBadgeFontSize(r.rank)}" font-weight="700" fill="#FFFFFF">${r.rank}</text><text x="${RANKING_BAR_PLOT.left}" y="${rowTop + 44}" font-size="38" font-weight="700" fill="${theme.ink}">${escapeXml(r.area_name)}</text><text x="${RANKING_BAR_PLOT.right}" y="${rowTop + 44}" text-anchor="end" font-size="40" font-weight="700" fill="${valueInk}">${chart.formatValue(r.value)}<tspan font-size="26" dx="4">${unit}</tspan></text><rect data-bar-track="true" x="${RANKING_BAR_PLOT.left}" y="${barY}" width="${plotWidth}" height="10" rx="5" fill="${track}"/><rect data-bar-value="true" x="${Math.min(origin, end)}" y="${barY}" width="${Math.abs(end - origin)}" height="10" rx="5" fill="${barOn(fill)}"/>${signed ? `<line x1="${origin}" y1="${barY - 5}" x2="${origin}" y2="${barY + 15}" stroke="${theme.ink}" stroke-width="2"/>` : ''}${marker}</g>`;
    }).join('')}`;
  return sampleFrame({
    title: labels.title, titleSize: fitTitleSize(labels.title),
    meta: metaLine(chart, axis),
    note: chart.note,
    source: chart.source,
    attributes: `data-image-template="bar" data-domain-min="${axis.min}" data-domain-max="${axis.max}"${labels.attributes ? ` ${labels.attributes}` : ''}`,
    body: group(rows.top, labels.upper, top, color) + group(rows.bottom, labels.lower, top + groupHeight + groupGap, lower),
    theme,
  });
}
