import { engelCoefficient } from '../../../data/metrics/engel-coefficient';
import { foodExpenditureTotal } from '../../../data/metrics/food-expenditure-total';
import { parseStatsValuesPayload } from '../../../packages/stats-r2/src/schemas';
import { assertMetricPresentation, resolveNumericDomain, type MetricPresentation } from '../../../packages/types/src/metric-presentation';
import { generateLineSvg } from '../../../packages/svg-builder/src/charts/line';
import { BRAND } from '../../web/src/features/ogp/brand';

export const TREND_SAMPLE_METRIC = engelCoefficient;
export const TREND_SAMPLE_ID = 'engel-trend';
export const TREND_SAMPLE_FRAME = { width: 1080, height: 1350 } as const;
export const TREND_SAMPLE_SOURCE = {
  bucket: 'stats47', key: 'app/stats/engel-coefficient/values.json',
  sha256: '4f76386523e4fb53d3eb42f46278216b405ee145a58570137b1606accdc36261', bytes: 100930,
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
  const chart = generateLineSvg(rows.map(row => ({
    metricKey: TREND_SAMPLE_METRIC.key,
    areaCode: TREND_SAMPLE_SERIES.areaCode, areaName: TREND_SAMPLE_SERIES.name,
    yearCode: String(row.year), yearName: String(row.year),
    value: row.value * factor, unit: TREND_SAMPLE_METRIC.display?.displayUnit ?? TREND_SAMPLE_METRIC.unit,
  })), {
    title: `${TREND_SAMPLE_SERIES.name}の${TREND_SAMPLE_METRIC.title}`,
    xKey: 'yearCode', seriesKey: 'areaCode',
    yDomain: [domain[0] * factor, domain[1] * factor],
    frame: { width: 340, height: 290 }, showHeading: false,
    showEndpointValues: true,
  });
  const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
  const source = 'displayName' in foodExpenditureTotal.source ? foodExpenditureTotal.source.displayName : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" data-domain-min="${domain[0]}" data-domain-max="${domain[1]}" role="img" aria-label="名古屋市のエンゲル係数・2007〜2024年">
    <rect width="1080" height="1350" fill="${BRAND.paper}"/>
    <g font-family="Noto Sans JP, Yu Gothic, Meiryo, sans-serif" fill="${BRAND.ink}">
      <text x="64" y="86" font-size="42" font-weight="700">stats47</text>
      <text x="64" y="184" font-size="72" font-weight="700">${escape(TREND_SAMPLE_METRIC.title)}の推移</text>
      <text x="64" y="246" font-size="32" fill="${BRAND.muted}">2007–2024年 · 単位：${escape(TREND_SAMPLE_METRIC.display?.displayUnit ?? TREND_SAMPLE_METRIC.unit)}</text>
      <text x="64" y="305" font-size="36">${TREND_SAMPLE_SERIES.name} · 二人以上の世帯</text>
      <svg x="64" y="350" width="952" height="812" viewBox="0 0 340 290" data-points="${rows.length}">${chart}</svg>
      <line x1="64" x2="1016" y1="1190" y2="1190" stroke="${BRAND.line}"/>
      <text x="64" y="1235" font-size="28" fill="${BRAND.muted}">出典：${escape(source ?? '')}</text>
    </g></svg>`;
}
