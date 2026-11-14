import { metricPresentation } from '../../../packages/data-configs/src/color-policy';
import { averageTemperature } from '../../../data/metrics/average-temperature';
import { keroseneConsumptionQuantity } from '../../../data/metrics/kerosene-consumption-quantity';
import { parseStatsValuesPayload } from '../../../packages/stats-r2/src/schemas';
import { resolveChartDomain } from '../../../packages/types/src/numeric-domain';
import { niceTicks } from '../../../packages/types/src/numeric-ticks';
import { linearScale } from '../../../packages/svg-builder/src/shared/axis';
import { linearRegression } from '../../../packages/svg-builder/src/shared/regression';
import { BRAND } from '../../web/src/features/ogp/brand';
import { SAMPLE_FRAME, escapeXml, sampleBodyTop, sampleFrame } from './template-sample-frame';
import { resolveMetricColor } from '../../remotion/src/features/data-cards/tile-scale';
import { LIGHT_THEME, mixColor, toHex, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import type { MetricPresentation } from '../../../packages/types/src/metric-presentation';

export const RELATIONSHIP_SAMPLE_ID = 'temperature-kerosene';
export const RELATIONSHIP_SAMPLE_YEAR = '2024';
export const RELATIONSHIP_SAMPLE_METRICS = { x: averageTemperature, y: keroseneConsumptionQuantity } as const;
export const RELATIONSHIP_SAMPLE_SOURCES = {
  x: {
    bucket: 'stats47', key: 'app/stats/average-temperature/values.json',
    sha256: '1085cc00b6564b5211de8ba6e927d68f58f93e66721300b184ec891d5e7f64f2', bytes: 279380,
  },
  y: {
    bucket: 'stats47', key: 'app/stats/kerosene-consumption-quantity/values.json',
    sha256: '37760c8c8de1eb22b19bfa8c66d3fa2e54c6c923d5cf08f8fbba72186bc24c52', bytes: 107073,
  },
} as const;
// The kerosene metric is surveyed in prefectural capitals; the image states it once.
const Y_SCOPE = '県庁所在市・二人以上世帯';
const PLOT_X = { left: 168, right: 1000 } as const;
const PLOT_BOTTOM = SAMPLE_FRAME.bodyBottom - 110;
const MAX_LABELS = 4;
const LABEL_FONT = 32;
// From the dot's centre to the near edge of its name: the named dot's radius and a 5px gap.
const LABEL_GAP = 18;
// A name above or below a dot at the plot's edge stops this far from the frame line.
const LABEL_INSET = 6;
const AXIS_FONT = 30;
const DOT_R = 10;
const NAMED_DOT_R = 13;
// About a thousand municipalities share the plot: dots this small keep the cloud readable at 320px.
const MUNICIPAL_DOT_R = 4;
const MUNICIPAL_NAMED_DOT_R = 9;
// A lowercase l reads as a vertical bar at 320px; the axis shows the litre symbol as L.
export const unitLabel = (unit: string) => (unit === 'l' ? 'L' : unit);

function yearRows(raw: unknown, metric: typeof averageTemperature) {
  const input = parseStatsValuesPayload(raw);
  if (input.metricKey !== metric.key || input.entityKind !== 'prefecture')
    throw Error('散布図見本の指標・地域単位が一致しません。');
  const rows = input.rows.filter((row) => row.yearCode === RELATIONSHIP_SAMPLE_YEAR);
  if (rows.length !== 47 || new Set(rows.map((row) => row.areaCode)).size !== 47 ||
    rows.some((row) => row.unit !== metric.unit || row.value === null || !Number.isFinite(row.value)))
    throw Error('散布図見本は全47都道府県の値・単位が必要です。');
  return new Map(rows.map((row) => [row.areaCode, { name: row.areaName, value: row.value! }]));
}

/** Join both fixed snapshots by prefecture code; any missing pair stops the sample. */
export function relationshipPoints(raw: unknown) {
  const { x, y } = raw as { x: unknown; y: unknown };
  const xs = yearRows(x, RELATIONSHIP_SAMPLE_METRICS.x), ys = yearRows(y, RELATIONSHIP_SAMPLE_METRICS.y);
  return [...xs].map(([code, row]) => {
    const pair = ys.get(code);
    if (!pair) throw Error('散布図見本の都道府県が一致しません。');
    return { code, name: row.name, x: row.value, y: pair.value };
  }).sort((a, b) => a.code.localeCompare(b.code));
}

export interface ScatterPoint { code: string; name: string; x: number; y: number }
/** Any relationship between areas: axis labels carry their units, `meta` the year(s). */
export interface ScatterChart {
  title: string; meta: string; note?: string; source: string;
  xLabel: string; yLabel: string; points: ScatterPoint[];
  /** The vertical axis metric's scheme: its strong colour marks the named prefectures, as in its bars and map. */
  presentation?: Pick<MetricPresentation, 'colorScheme' | 'colorSchemeType'>;
  /** Tick labels in the axis label's unit (e.g. 万円); thousands separators when omitted. */
  formatX?: (value: number) => string; formatY?: (value: number) => string;
  /** Prefectures left out on purpose (the source states which and why); the rest must all be there. */
  excludedCount?: number;
  /** What a dot is. Prefectures must all be there; municipalities are the set the caller built, counted in the meta line. */
  level?: 'prefecture' | 'municipality';
  /** Prefectures the article names; labelled before the extremes when they clear the other dots. */
  labelNames?: string[];
  /** Draw both axes on a log scale, for values spanning orders of magnitude. The trend line follows, so it fits the logs. */
  logAxes?: boolean;
}

/** 1, 2, 5 of each power of ten inside a log10 domain. */
function logTicks([min, max]: readonly [number, number]) {
  const ticks: number[] = [];
  for (let power = Math.floor(min); power <= Math.ceil(max); power++)
    for (const step of [1, 2, 5]) {
      const value = step * 10 ** power;
      if (Math.log10(value) >= min && Math.log10(value) <= max) ticks.push(value);
    }
  return ticks;
}

/** The sample: kerosene against temperature from the two fixed snapshots. */
export function renderRelationshipScatter(raw: unknown, theme: ChartTheme = LIGHT_THEME) {
  const { x: xMetric, y: yMetric } = RELATIONSHIP_SAMPLE_METRICS;
  const source = [xMetric, yMetric].map((m) => ('displayName' in m.source ? m.source.displayName : '') ?? '').join('・');
  return renderRelationshipScatterChart({
    title: `${xMetric.title}と${yMetric.title}`, meta: `${RELATIONSHIP_SAMPLE_YEAR}年`, source,
    xLabel: `${xMetric.title}（${unitLabel(xMetric.unit)}）`, yLabel: `${yMetric.title}（${unitLabel(yMetric.unit)}・${Y_SCOPE}）`,
    points: relationshipPoints(raw), presentation: metricPresentation(yMetric),
  }, theme);
}

/** A 4:5 scatter sized for 320px display: the points in the metric's tint, up to four named in its strong colour, regression line. */
export function renderRelationshipScatterChart(chart: ScatterChart, theme: ChartTheme = LIGHT_THEME) {
  const points = chart.logAxes ? chart.points.map((p) => ({ ...p, x: Math.log10(p.x), y: Math.log10(p.y) })) : chart.points;
  const municipal = chart.level === 'municipality';
  const expected = municipal ? points.length : 47 - (chart.excludedCount ?? 0);
  const areaCount = municipal ? `${expected.toLocaleString('ja-JP')}市区町村` : `${expected}都道府県`;
  const everyPrefecture = !municipal && expected === 47;
  const dotR = municipal ? MUNICIPAL_DOT_R : DOT_R, namedDotR = municipal ? MUNICIPAL_NAMED_DOT_R : NAMED_DOT_R;
  if (!expected || points.length !== expected || new Set(points.map((p) => p.code)).size !== expected ||
    points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y)))
    throw Error(municipal ? '散布図の市区町村の値を確認してください。' : `散布図は${areaCount}の値が必要です。`);
  const xDomain = resolveChartDomain(points.map((p) => p.x), { mode: 'extent', padding: 0.05 });
  const yDomain = resolveChartDomain(points.map((p) => p.y), { mode: 'extent', padding: 0.08 });
  if (!xDomain || !yDomain) throw Error('散布図の値がありません。');
  const dark = theme.name === 'dark';
  const PLOT = { ...PLOT_X, top: sampleBodyTop(Boolean(chart.note)) + 30, bottom: PLOT_BOTTOM };
  // Same colour logic as the bars: the metric's strong colour. On the dark paper it is lifted toward white and every dot
  // takes the grey outline of the tiles and bar rows, because a dark hue on #262626 has too little contrast alone.
  const color = toHex(resolveMetricColor(chart.presentation ?? {}) ?? BRAND.primary);
  const plot = dark ? theme.paper : BRAND.white;
  const ink = dark
    ? { plot, edge: theme.outline ?? theme.line, grid: theme.wash, tick: theme.muted, reg: theme.muted,
        named: mixColor(color, '#FFFFFF', 0.65), dot: mixColor(color, '#FFFFFF', 0.3), dotEdge: theme.outline ?? theme.line }
    : { plot, edge: BRAND.line, grid: BRAND.wash, tick: BRAND.muted, reg: BRAND.mutedLight,
        named: color, dot: mixColor(color, '#FFFFFF', 0.55), dotEdge: plot };
  const sx = linearScale(xDomain[0], xDomain[1], PLOT.left, PLOT.right);
  const sy = linearScale(yDomain[0], yDomain[1], PLOT.bottom, PLOT.top);
  const grouped = (v: number) => v.toLocaleString('ja-JP', { maximumFractionDigits: 2 });
  const fx = chart.formatX ?? grouped, fy = chart.formatY ?? grouped;
  const axisTicks = (domain: readonly [number, number], format: (value: number) => string) => chart.logAxes
    ? logTicks(domain).map((value) => ({ v: Math.log10(value), label: format(value) }))
    : niceTicks(domain[0], domain[1], 5).map((v) => ({ v, label: format(v) }));
  const xTicks = axisTicks(xDomain, fx).map(({ v, label }) =>
    `<line x1="${sx(v)}" x2="${sx(v)}" y1="${PLOT.top}" y2="${PLOT.bottom}" stroke="${ink.grid}"/><text x="${sx(v)}" y="${PLOT.bottom + 44}" text-anchor="middle" font-size="28" fill="${ink.tick}">${label}</text>`);
  const yTicks = axisTicks(yDomain, fy).map(({ v, label }) =>
    `<line x1="${PLOT.left}" x2="${PLOT.right}" y1="${sy(v)}" y2="${sy(v)}" stroke="${ink.grid}"/><text x="${PLOT.left - 16}" y="${sy(v) + 10}" text-anchor="end" font-size="28" fill="${ink.tick}">${label}</text>`);
  const reg = linearRegression(points);
  // Name the article's prefectures, then the extremes, only where the label clears every other dot.
  const named = (chart.labelNames ?? []).map((n) => points.find((p) => p.name === n)).filter((p): p is ScatterPoint => Boolean(p));
  // A single municipality's extreme is mostly sample noise, so only the names the caller chose appear.
  const extremes = municipal ? [] : [
    points.reduce((a, b) => (b.y > a.y ? b : a)), points.reduce((a, b) => (b.x > a.x ? b : a)),
    points.reduce((a, b) => (b.x < a.x ? b : a)), points.reduce((a, b) => (b.y < a.y ? b : a)),
  ];
  const labels: string[] = [];
  const placed: { x0: number; x1: number; y: number }[] = [];
  const namedPoints = new Set<ScatterPoint>();
  const half = LABEL_FONT / 2;
  for (const p of new Set([...named, ...extremes])) {
    if (labels.length === MAX_LABELS) break;
    const cx = sx(p.x), cy = sy(p.y), toLeft = cx > (PLOT.left + PLOT.right) / 2;
    const width = p.name.length * LABEL_FONT;
    const beside = (left: boolean) => ({ x0: left ? cx - LABEL_GAP - width : cx + LABEL_GAP, y: cy, x: left ? cx - LABEL_GAP : cx + LABEL_GAP, anchor: left ? 'end' : 'start' });
    // Above or below the dot, the name is centred on it and slides inward at the plot's edge, short of the frame line.
    const stacked = (direction: -1 | 1) => {
      const x0 = Math.min(Math.max(cx - width / 2, PLOT.left + LABEL_INSET), PLOT.right - LABEL_INSET - width);
      return { x0, y: cy + direction * (LABEL_GAP + half), x: x0 + width / 2, anchor: 'middle' };
    };
    // The side facing the middle of the plot first, as before; then the other side, above and below.
    const spot = [beside(toLeft), beside(!toLeft), stacked(-1), stacked(1)].find(({ x0, y }) => {
      const x1 = x0 + width;
      if (x0 < PLOT.left || x1 > PLOT.right || y - half < PLOT.top || y + half > PLOT.bottom) return false;
      if (placed.some((o) => x0 < o.x1 && x1 > o.x0 && Math.abs(o.y - y) < LABEL_FONT)) return false;
      // Hundreds of municipal dots leave no clear gap, and the caller named this town for the article: its small dots may sit under the label.
      return (municipal && named.includes(p)) || points.every((o) => o === p ||
        sx(o.x) + dotR < x0 || sx(o.x) - dotR > x1 || Math.abs(sy(o.y) - y) > half + dotR);
    });
    if (spot) {
      namedPoints.add(p);
      placed.push({ x0: spot.x0, x1: spot.x0 + width, y: spot.y });
      labels.push(`<text x="${spot.x}" y="${spot.y + 11}" text-anchor="${spot.anchor}" font-size="${LABEL_FONT}" font-weight="700">${escapeXml(p.name)}</text>`);
    }
  }
  const dot = (p: ScatterPoint) => {
    const isNamed = namedPoints.has(p);
    return `<circle data-pref="${p.code}" cx="${sx(p.x)}" cy="${sy(p.y)}" r="${isNamed ? namedDotR : dotR}" fill="${isNamed ? ink.named : ink.dot}" stroke="${ink.dotEdge}" stroke-width="${municipal ? 1 : 2}"/>`;
  };
  // Long axis labels shrink to their side of the plot, as the title does.
  const axisFont = (label: string, length: number) => Math.min(AXIS_FONT, Math.floor(length / label.length));
  return sampleFrame({
    // Two metric names can run long; shrink the title to the frame width instead of letting it overflow.
    title: chart.title, titleSize: Math.min(64, Math.floor((SAMPLE_FRAME.right - SAMPLE_FRAME.left) / chart.title.length)), meta: everyPrefecture ? chart.meta : `${chart.meta}・${areaCount}`, note: chart.note, source: chart.source, theme,
    ariaLabel: `${chart.title}・${everyPrefecture ? '全47都道府県' : areaCount}`, attributes: `data-image-template="scatter" data-points="${points.length}"${municipal ? ' data-level="municipality"' : ''}`,
    body: `<defs><clipPath id="scatter-plot"><rect x="${PLOT.left}" y="${PLOT.top}" width="${PLOT.right - PLOT.left}" height="${PLOT.bottom - PLOT.top}"/></clipPath></defs>
      <rect x="${PLOT.left}" y="${PLOT.top}" width="${PLOT.right - PLOT.left}" height="${PLOT.bottom - PLOT.top}" fill="${ink.plot}" stroke="${ink.edge}"/>
      ${xTicks.join('')}${yTicks.join('')}
      <line x1="${PLOT.left}" x2="${PLOT.right}" y1="${sy(reg.slope * xDomain[0] + reg.intercept)}" y2="${sy(reg.slope * xDomain[1] + reg.intercept)}" stroke="${ink.reg}" stroke-width="3" stroke-dasharray="12 8" clip-path="url(#scatter-plot)"/>
      ${points.filter((p) => !namedPoints.has(p)).map(dot).join('')}${[...namedPoints].map(dot).join('')}
      ${labels.join('')}
      <text x="${(PLOT.left + PLOT.right) / 2}" y="${PLOT.bottom + 100}" text-anchor="middle" font-size="${axisFont(chart.xLabel, PLOT.right - PLOT.left)}">${escapeXml(chart.xLabel)}</text>
      <text x="56" y="${(PLOT.top + PLOT.bottom) / 2}" text-anchor="middle" font-size="${axisFont(chart.yLabel, PLOT.bottom - PLOT.top)}" transform="rotate(-90 56 ${(PLOT.top + PLOT.bottom) / 2})">${escapeXml(chart.yLabel)}</text>`,
  });
}
