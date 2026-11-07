import { metricPresentation } from '../../../packages/data-configs/src/color-policy';
import { engelCoefficient } from '../../../data/metrics/engel-coefficient';
import { foodExpenditureTotal } from '../../../data/metrics/food-expenditure-total';
import { parseStatsValuesPayload } from '../../../packages/stats-r2/src/schemas';
import { assertMetricPresentation, resolveNumericDomain, type MetricPresentation } from '../../../packages/types/src/metric-presentation';
import { niceTicks } from '../../../packages/types/src/numeric-ticks';
import { BRAND } from '../../web/src/features/ogp/brand';
import { LIGHT_THEME, mixColor, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { SERIES_COLORS } from '../../../packages/svg-builder/src/shared/color';
import { SAMPLE_FRAME, escapeXml, fitTitleSize, sampleBodyTop, sampleFrame, textWidth } from './template-sample-frame';

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

/** One line of a line chart. A null value is a gap: the line stops there and is not joined across it. */
export interface LineSeries { label: string; points: { x: string; value: number | null }[] }
export interface LineChart {
  title: string;
  /** The period and unit line under the title. */
  meta: string;
  note?: string;
  source: string;
  series: LineSeries[];
  decimals: number;
  /** Stored value × factor = value shown (ticks and labels). */
  factor?: number;
  /** The metric's authored range; otherwise a nice range around the values. */
  domain?: [number, number];
  ariaLabel?: string;
  /** Two-point change (slope): every line carries its first value on the left, so the value axis has no tick labels. */
  startLabels?: boolean;
}

const MAX_X_LABELS = 7;
const DOT_LIMIT = 24;
const END_LABEL_SIZE = 36;
const END_LABEL_GAP = 42;
const yearOf = (x: string) => /^(\d{4})/.exec(x)?.[1];
const formatter = (decimals: number) => (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Every x of the chart in order: by year when all are years, otherwise in the order the data gives them. */
function chartXs(series: LineSeries[]) {
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))];
  if (!xs.every(yearOf)) return { xs, position: (x: string) => xs.indexOf(x) / Math.max(1, xs.length - 1) };
  const sorted = [...xs].sort((a, b) => Number(yearOf(a)) - Number(yearOf(b)));
  const first = Number(yearOf(sorted[0])), span = Number(yearOf(sorted[sorted.length - 1])) - first;
  return { xs: sorted, position: (x: string) => (span ? (Number(yearOf(x)) - first) / span : 0) };
}

/** Thin the x labels to a few, always keeping the last and dropping one that would touch it. */
function xLabels(xs: string[]) {
  const step = Math.max(1, Math.ceil((xs.length - 1) / (MAX_X_LABELS - 1)));
  const kept = xs.filter((_, i) => i % step === 0 && xs.length - 1 - i >= step * 0.6);
  return [...kept, xs[xs.length - 1]];
}

/** Move end labels apart, keeping their order, inside the plot's height. */
function spreadLabels(ys: number[], top: number, bottom: number, gap: number) {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  order.forEach((item, n) => { if (n && item.y < order[n - 1].y + gap) item.y = order[n - 1].y + gap; });
  const over = (order[order.length - 1]?.y ?? 0) - bottom;
  if (over > 0) order.forEach((item) => { item.y -= over; });
  order.forEach((item, n) => { if (item.y < top + n * gap) item.y = top + n * gap; });
  const placed = [...ys];
  order.forEach((item) => { placed[item.i] = item.y; });
  return placed;
}

/**
 * The line type at frame size: light value gridlines, no plot box. One line carries its first and last
 * value; several lines have one legend above the plot and each last value at its line's end.
 */
export function renderLineChart(chart: LineChart, theme: ChartTheme = LIGHT_THEME) {
  const { series, decimals, factor = 1 } = chart;
  const values = series.flatMap((s) => s.points.flatMap((p) => (p.value === null ? [] : [p.value])));
  if (!values.length) throw Error('折れ線の値がありません。');
  const format = formatter(decimals);
  const min = Math.min(...values), max = Math.max(...values);
  const ticks = niceTicks(min * factor, max * factor, 5);
  const domain = chart.domain ?? [Math.min(min, ticks[0] / factor), Math.max(max, ticks[ticks.length - 1] / factor)];
  if (domain[1] <= domain[0] || values.some((value) => value < domain[0] || value > domain[1]))
    throw Error('推移の表示範囲に値が収まりません。');
  const single = series.length === 1;
  const dark = theme.name === 'dark';
  const shade = (color: string) => (dark ? mixColor(color, '#FFFFFF', 0.3) : color);
  const colorOf = (i: number) => shade(single ? BRAND.primary : SERIES_COLORS[i % SERIES_COLORS.length]);
  const { xs, position } = chartXs(series);

  // One legend above the plot, wrapped to the frame's width.
  const legendItems: string[] = [];
  let legendX: number = SAMPLE_FRAME.left, legendY = sampleBodyTop(Boolean(chart.note)) + 24;
  if (!single) series.forEach((s, i) => {
    const width = 52 + textWidth(s.label, 30) + 36;
    if (legendX + width > SAMPLE_FRAME.right && legendX > SAMPLE_FRAME.left) { legendX = SAMPLE_FRAME.left; legendY += 48; }
    legendItems.push(`<rect x="${legendX}" y="${legendY - 14}" width="38" height="8" rx="4" fill="${colorOf(i)}"/><text x="${legendX + 52}" y="${legendY}" font-size="30" fill="${theme.ink}">${escapeXml(s.label)}</text>`);
    legendX += width;
  });
  const top = (single ? sampleBodyTop(Boolean(chart.note)) + 40 : legendY + 40) + 40;
  const tickValues = ticks.filter((t) => t >= domain[0] * factor && t <= domain[1] * factor);
  const tickDecimals = Math.min(2, Math.max(0, ...tickValues.map((t) => (String(t).split('.')[1] ?? '').length)));
  const tickFormat = formatter(tickDecimals);
  const lastPoints = series.map((s) => [...s.points].reverse().find((p) => p.value !== null));
  const endWidth = Math.max(...lastPoints.map((p) => textWidth(p ? format(p.value! * factor) : '', END_LABEL_SIZE)));
  const firstPoints = series.map((s) => s.points.find((p) => p.value !== null));
  const startWidth = Math.max(...firstPoints.map((p) => textWidth(p ? format(p.value! * factor) : '', END_LABEL_SIZE)));
  const plot = {
    left: SAMPLE_FRAME.left + (chart.startLabels ? startWidth : Math.max(...tickValues.map((t) => textWidth(tickFormat(t), 28)))) + 20,
    right: SAMPLE_FRAME.right - endWidth - 18, top, bottom: SAMPLE_FRAME.bodyBottom - 70,
  };
  const xAt = (x: string) => plot.left + (plot.right - plot.left) * position(x);
  const yAt = (value: number) => plot.bottom - (plot.bottom - plot.top) * (value - domain[0]) / (domain[1] - domain[0]);
  const grid = tickValues.map((tick) => {
    const y = yAt(tick / factor);
    return `<line x1="${plot.left}" y1="${y}" x2="${plot.right}" y2="${y}" stroke="${theme.line}" stroke-width="1.5"/>${chart.startLabels ? '' : `<text x="${plot.left - 20}" y="${y + 10}" text-anchor="end" font-size="28" fill="${theme.muted}">${tickFormat(tick)}</text>`}`;
  }).join('');
  const labels = xLabels(xs).map((x) => `<text x="${xAt(x)}" y="${plot.bottom + 52}" text-anchor="middle" font-size="28" fill="${theme.muted}">${escapeXml(x.replace(/年度?$/, ''))}</text>`).join('');
  const dots = xs.length <= DOT_LIMIT;
  const lines = series.map((s, i) => {
    const color = colorOf(i);
    const runs: string[][] = [[]];
    s.points.forEach((p) => {
      if (p.value === null) runs.push([]);
      else runs[runs.length - 1].push(`${xAt(p.x).toFixed(1)},${yAt(p.value).toFixed(1)}`);
    });
    const paths = runs.filter((run) => run.length > 1).map((run) => `<polyline points="${run.join(' ')}" fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round"/>`).join('');
    const observed = s.points.filter((p) => p.value !== null);
    const marks = dots ? observed : observed.slice(-1);
    const circles = marks.map((p) => `<circle cx="${xAt(p.x).toFixed(1)}" cy="${yAt(p.value!).toFixed(1)}" r="${single ? 8 : 7}" fill="${color}" stroke="${theme.paper}" stroke-width="3"/>`).join('');
    return `<g data-series="${escapeXml(s.label)}" data-points="${observed.length}">${paths}${circles}</g>`;
  }).join('');
  const endYs = spreadLabels(lastPoints.map((p) => (p ? yAt(p.value!) : plot.top) + 13), plot.top, plot.bottom, END_LABEL_GAP);
  const ends = lastPoints.map((p, i) => (p ? `<text x="${xAt(p.x) + 18}" y="${endYs[i]}" font-size="${END_LABEL_SIZE}" font-weight="700" fill="${colorOf(i)}">${format(p.value! * factor)}</text>` : '')).join('');
  const startYs = spreadLabels(firstPoints.map((p) => (p ? yAt(p.value!) : plot.top) + 13), plot.top, plot.bottom, END_LABEL_GAP);
  const starts = chart.startLabels ? firstPoints.map((p, i) => (p ? `<text x="${xAt(p.x) - 18}" y="${startYs[i]}" text-anchor="end" font-size="${END_LABEL_SIZE}" font-weight="700" fill="${colorOf(i)}">${format(p.value! * factor)}</text>` : '')).join('') : '';
  const first = single && !chart.startLabels ? series[0].points.find((p) => p.value !== null) : undefined;
  // Below its point, or beside it when the point sits on the floor of the plot (the year labels are under it).
  const onFloor = first ? yAt(first.value!) + 58 > plot.bottom - 8 : false;
  const firstY = first ? yAt(first.value!) + (onFloor ? 10 : 58) : 0;
  const firstLabel = first && first !== lastPoints[0] ? `<text x="${xAt(first.x) + (onFloor ? 24 : 0)}" y="${firstY}" font-size="${END_LABEL_SIZE}" font-weight="700" fill="${colorOf(0)}">${format(first.value! * factor)}</text>` : '';
  return sampleFrame({
    title: chart.title, titleSize: fitTitleSize(chart.title), meta: chart.meta, note: chart.note, source: chart.source,
    ariaLabel: chart.ariaLabel ?? chart.title,
    attributes: `data-image-template="line"${chart.startLabels ? ' data-form="slope"' : ''} data-domain-min="${domain[0]}" data-domain-max="${domain[1]}"`,
    body: legendItems.join('') + grid + labels + lines + ends + starts + firstLabel,
    theme,
  });
}

/** A portrait line form using the site's authored trend domain and shared SVG scales. */
export function renderTrendLine(raw: unknown, presentation: MetricPresentation = metricPresentation(TREND_SAMPLE_METRIC)) {
  const rows = trendSampleRows(raw);
  assertMetricPresentation(presentation);
  const domain = resolveNumericDomain(rows.map((row) => row.value), presentation.trendDomain);
  if (!domain) throw Error('推移の表示範囲に値が収まりません。');
  const source = 'displayName' in foodExpenditureTotal.source ? foodExpenditureTotal.source.displayName : '';
  return renderLineChart({
    title: `${TREND_SAMPLE_METRIC.title}の推移`,
    meta: `${TREND_SAMPLE_SERIES.from}–${TREND_SAMPLE_SERIES.to}年 · 単位：${TREND_SAMPLE_METRIC.display?.displayUnit ?? TREND_SAMPLE_METRIC.unit}`,
    note: `${TREND_SAMPLE_SERIES.name} · 二人以上の世帯`,
    source: source ?? '',
    ariaLabel: `${TREND_SAMPLE_SERIES.name}の${TREND_SAMPLE_METRIC.title}・${TREND_SAMPLE_SERIES.from}〜${TREND_SAMPLE_SERIES.to}年`,
    series: [{ label: TREND_SAMPLE_SERIES.name, points: rows.map((row) => ({ x: String(row.year), value: row.value })) }],
    decimals: TREND_SAMPLE_METRIC.display?.decimalPlaces ?? 1,
    factor: TREND_SAMPLE_METRIC.display?.conversionFactor ?? 1,
    domain,
  });
}
