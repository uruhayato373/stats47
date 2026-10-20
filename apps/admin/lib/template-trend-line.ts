import { engelCoefficient } from '../../../data/metrics/engel-coefficient';
import { foodExpenditureTotal } from '../../../data/metrics/food-expenditure-total';
import { parseStatsValuesPayload } from '../../../packages/stats-r2/src/schemas';
import { assertMetricPresentation, resolveNumericDomain, type MetricPresentation } from '../../../packages/types/src/metric-presentation';
import { linearScale, niceTicks } from '../../../packages/svg-builder/src/shared/axis';
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
  const format = new Intl.NumberFormat('ja-JP', { minimumFractionDigits: TREND_SAMPLE_METRIC.display?.decimalPlaces ?? 1, maximumFractionDigits: TREND_SAMPLE_METRIC.display?.decimalPlaces ?? 1 });
  const x = linearScale(TREND_SAMPLE_SERIES.from, TREND_SAMPLE_SERIES.to, 144, 952);
  const y = linearScale(domain[0], domain[1], 1040, 430);
  const ticks = niceTicks(domain[0], domain[1], 3);
  const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
  const source = 'displayName' in foodExpenditureTotal.source ? foodExpenditureTotal.source.displayName : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" data-domain-min="${domain[0]}" data-domain-max="${domain[1]}" role="img" aria-label="名古屋市のエンゲル係数・2007〜2024年">
    <rect width="1080" height="1350" fill="${BRAND.paper}"/>
    <g font-family="Noto Sans JP, Yu Gothic, Meiryo, sans-serif" fill="${BRAND.ink}">
      <text x="64" y="86" font-size="42" font-weight="700">stats47</text>
      <text x="64" y="184" font-size="72" font-weight="700">${escape(TREND_SAMPLE_METRIC.title)}の推移</text>
      <text x="64" y="246" font-size="32" fill="${BRAND.muted}">2007–2024年 · 単位：${escape(TREND_SAMPLE_METRIC.display?.displayUnit ?? TREND_SAMPLE_METRIC.unit)}</text>
      <text x="64" y="305" font-size="36">${TREND_SAMPLE_SERIES.name} · 二人以上の世帯</text>
      ${ticks.map((tick) => `<line x1="144" x2="952" y1="${y(tick)}" y2="${y(tick)}" stroke="${BRAND.line}"/><text x="116" y="${y(tick) + 12}" text-anchor="end" font-size="32" fill="${BRAND.muted}">${format.format(tick * factor)}</text>`).join('')}
      <polyline data-series="${TREND_SAMPLE_SERIES.areaCode}" data-points="${rows.length}" points="${rows.map((row) => `${x(row.year)},${y(row.value)}`).join(' ')}" fill="none" stroke="${BRAND.primary}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
      ${rows.map((row, i) => `<circle data-year="${row.year}" data-value="${row.value}" cx="${x(row.year)}" cy="${y(row.value)}" r="${i === 0 || i === rows.length - 1 ? 9 : 4}" fill="${BRAND.primary}"/>`).join('')}
      ${[rows[0], rows[rows.length - 1]].map((row) => `<text x="${x(row.year)}" y="1154" text-anchor="middle" font-size="38" font-weight="700" fill="${BRAND.primary}">${format.format(row.value * factor)}</text>`).join('')}
      ${[2007, 2012, 2018, 2024].map((year) => `<text x="${x(year)}" y="1102" text-anchor="middle" font-size="34" fill="${BRAND.muted}">${year}</text>`).join('')}
      <line x1="64" x2="1016" y1="1190" y2="1190" stroke="${BRAND.line}"/>
      <text x="64" y="1235" font-size="28" fill="${BRAND.muted}">出典：${escape(source ?? '')}</text>
    </g></svg>`;
}
