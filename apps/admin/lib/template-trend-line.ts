import { engelCoefficient } from '../../../data/metrics/engel-coefficient';
import { foodExpenditureTotal } from '../../../data/metrics/food-expenditure-total';
import { parseStatsValuesPayload } from '../../../packages/stats-r2/src/schemas';
import { assertMetricPresentation, resolveNumericDomain, type MetricPresentation } from '../../../packages/types/src/metric-presentation';
import { niceTicks } from '../../../packages/types/src/numeric-ticks';
import { BRAND } from '../../web/src/features/ogp/brand';
import { SAMPLE_FRAME, sampleBodyTop, sampleFrame } from './template-sample-frame';

export const TREND_SAMPLE_METRIC = engelCoefficient;
export const TREND_SAMPLE_ID = 'engel-trend';
export const TREND_SAMPLE_FRAME = { width: 1080, height: 1350 } as const;
export const TREND_SAMPLE_SOURCE = {
  bucket: 'stats47', key: 'app/stats/engel-coefficient/values.json',
  sha256: '963476e9a6c482ec195ea6f6f327f13e49d2278155872c67f8bab0d5c5e152b2', bytes: 100930,
} as const;
export const TREND_SAMPLE_SERIES = { areaCode: '23000', name: '名古屋市', from: 2007, to: 2024 } as const;

/** This metric represents prefectural capitals, not whole-prefecture households or a national mean. */
export function trendSampleRows(raw: unknown) {
  const input = parseStatsValuesPayload(raw);
  if (input.metricKey !== TREND_SAMPLE_METRIC.key || input.entityKind !== 'prefecture')
    throw Error('推移見本の指標・地域単位が一致しません。');
  const rows = input.rows.filter((row) => row.areaCode === TREND_SAMPLE_SERIES.areaCode &&
    Number(row.yearCode) >= TREND_SAMPLE_SERIES.from && Number(row.yearCode) <= TREND_SAMPLE_SERIES.to);
  const years = Array.from({ length: TREND_SAMPLE_SERIES.to - TREND_SAMPLE_SERIES.from + 1 }, (_, i) => String(TREND_SAMPLE_SERIES.from + i));
  if (rows.length !== years.length || years.some((year) => rows.filter((row) => row.yearCode === year).length !== 1) ||
    rows.some((row) => row.unit !== TREND_SAMPLE_METRIC.unit || row.value === null || !Number.isFinite(row.value)))
    throw Error('推移見本の各年の値・単位を確認してください。欠測を線で結びません。');
  return rows.map((row) => ({ year: Number(row.yearCode), value: row.value! })).sort((a, b) => a.year - b.year);
}

/** A portrait line form using the site's authored trend domain and shared SVG scales. */
export function renderTrendLine(raw: unknown, presentation: MetricPresentation = TREND_SAMPLE_METRIC.visualization) {
  const rows = trendSampleRows(raw);
  assertMetricPresentation(presentation);
  const factor = TREND_SAMPLE_METRIC.display?.conversionFactor ?? 1;
  const values = rows.map((row) => row.value);
  const domain = resolveNumericDomain(values, presentation.trendDomain);
  if (!domain || values.some((value) => value < domain[0] || value > domain[1]))
    throw Error('推移の表示範囲に値が収まりません。');
  // Drawn at frame size: light value gridlines, no plot box, the first and last values next to their points.
  const decimals = TREND_SAMPLE_METRIC.display?.decimalPlaces ?? 1;
  const top = sampleBodyTop(true) + 40;
  const plot = { left: 150, right: SAMPLE_FRAME.right - 110, top: top + 40, bottom: SAMPLE_FRAME.bodyBottom - 70 };
  const xAt = (year: number) => plot.left + (plot.right - plot.left) * (year - TREND_SAMPLE_SERIES.from) / (TREND_SAMPLE_SERIES.to - TREND_SAMPLE_SERIES.from);
  const yAt = (value: number) => plot.bottom - (plot.bottom - plot.top) * (value - domain[0]) / (domain[1] - domain[0]);
  const grid = niceTicks(domain[0] * factor, domain[1] * factor, 5).filter((t) => t >= domain[0] * factor && t <= domain[1] * factor).map((tick) => {
    const y = yAt(tick / factor);
    return `<line x1="${plot.left}" y1="${y}" x2="${plot.right}" y2="${y}" stroke="${BRAND.line}" stroke-width="1.5"/><text x="${plot.left - 20}" y="${y + 10}" text-anchor="end" font-size="28" fill="${BRAND.muted}">${tick}</text>`;
  }).join('');
  const years = rows.map((row) => row.year).filter((year, i, all) => (year - TREND_SAMPLE_SERIES.from) % 3 === 0 || i === all.length - 1);
  const xLabels = years.filter((year, i, all) => i === all.length - 1 || all[all.length - 1] - year >= 2)
    .map((year) => `<text x="${xAt(year)}" y="${plot.bottom + 52}" text-anchor="middle" font-size="28" fill="${BRAND.muted}">${year}</text>`).join('');
  const points = rows.map((row) => `${xAt(row.year).toFixed(1)},${yAt(row.value).toFixed(1)}`).join(' ');
  const dots = rows.map((row) => `<circle cx="${xAt(row.year).toFixed(1)}" cy="${yAt(row.value).toFixed(1)}" r="8" fill="${BRAND.primary}" stroke="${BRAND.paper}" stroke-width="3"/>`).join('');
  const first = rows[0], last = rows[rows.length - 1];
  // First value below its point, last value to the right of its point, so neither sits on the line.
  const endLabel = (row: typeof first, position: 'below' | 'right') => `<text x="${xAt(row.year) + (position === 'right' ? 18 : 0)}" y="${yAt(row.value) + (position === 'right' ? 14 : 58)}" text-anchor="start" font-size="40" font-weight="700" fill="${BRAND.primary}">${(row.value * factor).toFixed(decimals)}</text>`;
  const body = `<g data-points="${rows.length}">${grid}${xLabels}<polyline points="${points}" fill="none" stroke="${BRAND.primary}" stroke-width="5" stroke-linejoin="round"/>${dots}${endLabel(first, 'below')}${endLabel(last, 'right')}</g>`;
  const source = 'displayName' in foodExpenditureTotal.source ? foodExpenditureTotal.source.displayName : '';
  return sampleFrame({
    title: `${TREND_SAMPLE_METRIC.title}の推移`,
    meta: `${TREND_SAMPLE_SERIES.from}–${TREND_SAMPLE_SERIES.to}年 · 単位：${TREND_SAMPLE_METRIC.display?.displayUnit ?? TREND_SAMPLE_METRIC.unit}`,
    note: `${TREND_SAMPLE_SERIES.name} · 二人以上の世帯`,
    source: source ?? '',
    ariaLabel: `${TREND_SAMPLE_SERIES.name}の${TREND_SAMPLE_METRIC.title}・${TREND_SAMPLE_SERIES.from}〜${TREND_SAMPLE_SERIES.to}年`,
    attributes: `data-domain-min="${domain[0]}" data-domain-max="${domain[1]}"`,
    body,
  });
}
