import { averageTemperature } from '../../../data/metrics/average-temperature';
import { keroseneConsumptionQuantity } from '../../../data/metrics/kerosene-consumption-quantity';
import { parseStatsValuesPayload } from '../../../packages/stats-r2/src/schemas';
import { resolveChartDomain } from '../../../packages/types/src/numeric-domain';
import { niceTicks } from '../../../packages/types/src/numeric-ticks';
import { linearScale } from '../../../packages/svg-builder/src/shared/axis';
import { linearRegression } from '../../../packages/svg-builder/src/shared/regression';
import { SCATTER_COLORS } from '../../../packages/svg-builder/src/shared/color';
import { BRAND } from '../../web/src/features/ogp/brand';
import { SAMPLE_FRAME, escapeXml, sampleBodyTop, sampleFrame } from './template-sample-frame';
import { LIGHT_THEME, mixColor, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';

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
const PLOT = { left: 168, right: 1000, top: sampleBodyTop(true) + 30, bottom: SAMPLE_FRAME.bodyBottom - 110 } as const;
const MAX_LABELS = 2;
const LABEL_FONT = 32;
const DOT_R = 10;
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
/** Any 47-prefecture relationship: axis labels carry their units, `meta` the year(s). */
export interface ScatterChart {
  title: string; meta: string; note?: string; source: string;
  xLabel: string; yLabel: string; points: ScatterPoint[];
  /** Tick labels in the axis label's unit (e.g. 万円); thousands separators when omitted. */
  formatX?: (value: number) => string; formatY?: (value: number) => string;
  /** Prefectures the article names; labelled before the extremes when they clear the other dots. */
  labelNames?: string[];
}

/** The sample: kerosene against temperature from the two fixed snapshots. */
export function renderRelationshipScatter(raw: unknown, theme: ChartTheme = LIGHT_THEME) {
  const { x: xMetric, y: yMetric } = RELATIONSHIP_SAMPLE_METRICS;
  const source = [xMetric, yMetric].map((m) => ('displayName' in m.source ? m.source.displayName : '') ?? '').join('・');
  return renderRelationshipScatterChart({
    title: `${xMetric.title}と${yMetric.title}`, meta: `${RELATIONSHIP_SAMPLE_YEAR}年`, note: `${yMetric.title}：${Y_SCOPE}`, source,
    xLabel: `${xMetric.title}（${unitLabel(xMetric.unit)}）`, yLabel: `${yMetric.title}（${unitLabel(yMetric.unit)}）`,
    points: relationshipPoints(raw),
  }, theme);
}

/** A 4:5 scatter sized for 320px display: 47 neutral points, regression line, two labelled points. */
export function renderRelationshipScatterChart(chart: ScatterChart, theme: ChartTheme = LIGHT_THEME) {
  const { points } = chart;
  if (points.length !== 47 || new Set(points.map((p) => p.code)).size !== 47 ||
    points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y)))
    throw Error('散布図は全47都道府県の値が必要です。');
  const xDomain = resolveChartDomain(points.map((p) => p.x), { mode: 'extent', padding: 0.05 });
  const yDomain = resolveChartDomain(points.map((p) => p.y), { mode: 'extent', padding: 0.08 });
  if (!xDomain || !yDomain) throw Error('散布図の値がありません。');
  const dark = theme.name === 'dark';
  // Light keeps the brand colours of the sample; dark lifts the dots and rules off the grey paper.
  const ink = dark
    ? { plot: theme.paper, edge: theme.outline ?? theme.line, grid: theme.wash, tick: theme.muted, reg: theme.muted,
        dot: mixColor(SCATTER_COLORS.mid.fill, '#FFFFFF', 0.45), dotEdge: mixColor(SCATTER_COLORS.mid.stroke, '#FFFFFF', 0.7) }
    : { plot: BRAND.white, edge: BRAND.line, grid: BRAND.wash, tick: BRAND.muted, reg: BRAND.mutedLight,
        dot: SCATTER_COLORS.mid.fill, dotEdge: SCATTER_COLORS.mid.stroke };
  const sx = linearScale(xDomain[0], xDomain[1], PLOT.left, PLOT.right);
  const sy = linearScale(yDomain[0], yDomain[1], PLOT.bottom, PLOT.top);
  const grouped = (v: number) => v.toLocaleString('ja-JP', { maximumFractionDigits: 2 });
  const fx = chart.formatX ?? grouped, fy = chart.formatY ?? grouped;
  const xTicks = niceTicks(xDomain[0], xDomain[1], 5).map((v) =>
    `<line x1="${sx(v)}" x2="${sx(v)}" y1="${PLOT.top}" y2="${PLOT.bottom}" stroke="${ink.grid}"/><text x="${sx(v)}" y="${PLOT.bottom + 44}" text-anchor="middle" font-size="28" fill="${ink.tick}">${fx(v)}</text>`);
  const yTicks = niceTicks(yDomain[0], yDomain[1], 5).map((v) =>
    `<line x1="${PLOT.left}" x2="${PLOT.right}" y1="${sy(v)}" y2="${sy(v)}" stroke="${ink.grid}"/><text x="${PLOT.left - 16}" y="${sy(v) + 10}" text-anchor="end" font-size="28" fill="${ink.tick}">${fy(v)}</text>`);
  const reg = linearRegression(points);
  // Name the article's prefectures, then the extremes, only where the label clears every other dot.
  const named = (chart.labelNames ?? []).map((n) => points.find((p) => p.name === n)).filter((p): p is ScatterPoint => Boolean(p));
  const extremes = [
    points.reduce((a, b) => (b.y > a.y ? b : a)), points.reduce((a, b) => (b.x > a.x ? b : a)),
    points.reduce((a, b) => (b.x < a.x ? b : a)), points.reduce((a, b) => (b.y < a.y ? b : a)),
  ];
  const labels: string[] = [];
  for (const p of new Set([...named, ...extremes])) {
    if (labels.length === MAX_LABELS) break;
    const cx = sx(p.x), cy = sy(p.y), toLeft = cx > (PLOT.left + PLOT.right) / 2;
    const width = p.name.length * LABEL_FONT;
    const x0 = toLeft ? cx - 18 - width : cx + 18, x1 = x0 + width;
    const clear = x0 >= PLOT.left && x1 <= PLOT.right && points.every((o) => o === p ||
      sx(o.x) + DOT_R < x0 || sx(o.x) - DOT_R > x1 || Math.abs(sy(o.y) - cy) > LABEL_FONT / 2 + DOT_R);
    if (clear) labels.push(`<text x="${toLeft ? cx - 18 : cx + 18}" y="${cy + 11}" text-anchor="${toLeft ? 'end' : 'start'}" font-size="${LABEL_FONT}" font-weight="700">${escapeXml(p.name)}</text>`);
  }
  return sampleFrame({
    // Two metric names can run long; shrink the title to the frame width instead of letting it overflow.
    title: chart.title, titleSize: Math.min(64, Math.floor((SAMPLE_FRAME.right - SAMPLE_FRAME.left) / chart.title.length)), meta: chart.meta, note: chart.note, source: chart.source, theme,
    ariaLabel: `${chart.title}・全47都道府県`, attributes: `data-image-template="scatter" data-points="${points.length}"`,
    body: `<defs><clipPath id="scatter-plot"><rect x="${PLOT.left}" y="${PLOT.top}" width="${PLOT.right - PLOT.left}" height="${PLOT.bottom - PLOT.top}"/></clipPath></defs>
      <rect x="${PLOT.left}" y="${PLOT.top}" width="${PLOT.right - PLOT.left}" height="${PLOT.bottom - PLOT.top}" fill="${ink.plot}" stroke="${ink.edge}"/>
      ${xTicks.join('')}${yTicks.join('')}
      <line x1="${PLOT.left}" x2="${PLOT.right}" y1="${sy(reg.slope * xDomain[0] + reg.intercept)}" y2="${sy(reg.slope * xDomain[1] + reg.intercept)}" stroke="${ink.reg}" stroke-width="3" stroke-dasharray="12 8" clip-path="url(#scatter-plot)"/>
      ${points.map((p) => `<circle data-pref="${p.code}" cx="${sx(p.x)}" cy="${sy(p.y)}" r="${DOT_R}" fill="${ink.dot}" fill-opacity="0.85" stroke="${ink.dotEdge}" stroke-width="2"/>`).join('')}
      ${labels.join('')}
      <text x="${(PLOT.left + PLOT.right) / 2}" y="${PLOT.bottom + 100}" text-anchor="middle" font-size="30">${escapeXml(chart.xLabel)}</text>
      <text x="56" y="${(PLOT.top + PLOT.bottom) / 2}" text-anchor="middle" font-size="30" transform="rotate(-90 56 ${(PLOT.top + PLOT.bottom) / 2})">${escapeXml(chart.yLabel)}</text>`,
  });
}
