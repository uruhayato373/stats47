import { averageTemperature } from '../../../data/metrics/average-temperature';
import { keroseneConsumptionQuantity } from '../../../data/metrics/kerosene-consumption-quantity';
import { parseStatsValuesPayload } from '../../../packages/stats-r2/src/schemas';
import { resolveChartDomain } from '../../../packages/types/src/numeric-domain';
import { niceTicks } from '../../../packages/types/src/numeric-ticks';
import { linearScale, formatTick } from '../../../packages/svg-builder/src/shared/axis';
import { linearRegression } from '../../../packages/svg-builder/src/shared/regression';
import { SCATTER_COLORS } from '../../../packages/svg-builder/src/shared/color';
import { BRAND } from '../../web/src/features/ogp/brand';
import { SAMPLE_FRAME, escapeXml, sampleBodyTop, sampleFrame } from './template-sample-frame';

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
const unitLabel = (unit: string) => (unit === 'l' ? 'L' : unit);

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

/** A 4:5 scatter sized for 320px display: 47 neutral points, regression line, two extreme labels. */
export function renderRelationshipScatter(raw: unknown) {
  const points = relationshipPoints(raw);
  const xDomain = resolveChartDomain(points.map((p) => p.x), { mode: 'extent', padding: 0.05 });
  const yDomain = resolveChartDomain(points.map((p) => p.y), { mode: 'extent', padding: 0.08 });
  if (!xDomain || !yDomain) throw Error('散布図の値がありません。');
  const sx = linearScale(xDomain[0], xDomain[1], PLOT.left, PLOT.right);
  const sy = linearScale(yDomain[0], yDomain[1], PLOT.bottom, PLOT.top);
  const { x: xMetric, y: yMetric } = RELATIONSHIP_SAMPLE_METRICS;
  const xTicks = niceTicks(xDomain[0], xDomain[1], 5).map((v) =>
    `<line x1="${sx(v)}" x2="${sx(v)}" y1="${PLOT.top}" y2="${PLOT.bottom}" stroke="${BRAND.wash}"/><text x="${sx(v)}" y="${PLOT.bottom + 44}" text-anchor="middle" font-size="28" fill="${BRAND.muted}">${formatTick(v)}</text>`);
  const yTicks = niceTicks(yDomain[0], yDomain[1], 5).map((v) =>
    `<line x1="${PLOT.left}" x2="${PLOT.right}" y1="${sy(v)}" y2="${sy(v)}" stroke="${BRAND.wash}"/><text x="${PLOT.left - 16}" y="${sy(v) + 10}" text-anchor="end" font-size="28" fill="${BRAND.muted}">${formatTick(v)}</text>`);
  const reg = linearRegression(points);
  // Name only extreme points whose label clears every other dot; a crowded extreme stays unlabelled.
  const extremes = [
    points.reduce((a, b) => (b.y > a.y ? b : a)), points.reduce((a, b) => (b.x > a.x ? b : a)),
    points.reduce((a, b) => (b.x < a.x ? b : a)), points.reduce((a, b) => (b.y < a.y ? b : a)),
  ];
  const labels: string[] = [];
  for (const p of new Set(extremes)) {
    if (labels.length === MAX_LABELS) break;
    const cx = sx(p.x), cy = sy(p.y), toLeft = cx > (PLOT.left + PLOT.right) / 2;
    const width = p.name.length * LABEL_FONT;
    const x0 = toLeft ? cx - 18 - width : cx + 18, x1 = x0 + width;
    const clear = x0 >= PLOT.left && x1 <= PLOT.right && points.every((o) => o === p ||
      sx(o.x) + DOT_R < x0 || sx(o.x) - DOT_R > x1 || Math.abs(sy(o.y) - cy) > LABEL_FONT / 2 + DOT_R);
    if (clear) labels.push(`<text x="${toLeft ? cx - 18 : cx + 18}" y="${cy + 11}" text-anchor="${toLeft ? 'end' : 'start'}" font-size="${LABEL_FONT}" font-weight="700">${escapeXml(p.name)}</text>`);
  }
  const source = [xMetric, yMetric].map((m) => ('displayName' in m.source ? m.source.displayName : '') ?? '').join('・');
  return sampleFrame({
    title: `${xMetric.title}と${yMetric.title}`, titleSize: 64,
    meta: `${RELATIONSHIP_SAMPLE_YEAR}年`, note: `${yMetric.title}：${Y_SCOPE}`, source,
    ariaLabel: `${xMetric.title}と${yMetric.title}・全47都道府県`, attributes: `data-points="${points.length}"`,
    body: `<defs><clipPath id="scatter-plot"><rect x="${PLOT.left}" y="${PLOT.top}" width="${PLOT.right - PLOT.left}" height="${PLOT.bottom - PLOT.top}"/></clipPath></defs>
      <rect x="${PLOT.left}" y="${PLOT.top}" width="${PLOT.right - PLOT.left}" height="${PLOT.bottom - PLOT.top}" fill="${BRAND.white}" stroke="${BRAND.line}"/>
      ${xTicks.join('')}${yTicks.join('')}
      <line x1="${PLOT.left}" x2="${PLOT.right}" y1="${sy(reg.slope * xDomain[0] + reg.intercept)}" y2="${sy(reg.slope * xDomain[1] + reg.intercept)}" stroke="${BRAND.mutedLight}" stroke-width="3" stroke-dasharray="12 8" clip-path="url(#scatter-plot)"/>
      ${points.map((p) => `<circle data-pref="${p.code}" cx="${sx(p.x)}" cy="${sy(p.y)}" r="${DOT_R}" fill="${SCATTER_COLORS.mid.fill}" fill-opacity="0.85" stroke="${SCATTER_COLORS.mid.stroke}" stroke-width="2"/>`).join('')}
      ${labels.join('')}
      <text x="${(PLOT.left + PLOT.right) / 2}" y="${PLOT.bottom + 100}" text-anchor="middle" font-size="30">${escapeXml(xMetric.title)}（${escapeXml(unitLabel(xMetric.unit))}）</text>
      <text x="56" y="${(PLOT.top + PLOT.bottom) / 2}" text-anchor="middle" font-size="30" transform="rotate(-90 56 ${(PLOT.top + PLOT.bottom) / 2})">${escapeXml(yMetric.title)}（${escapeXml(unitLabel(yMetric.unit))}）</text>`,
  });
}
