import fs from 'node:fs';
import path from 'node:path';
import type { Topology } from 'topojson-specification';
import { LIGHT_THEME, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { computeBuzzMapGeo } from '../../remotion/src/features/buzz-map/geo';
import { mapValueFormatter, renderClassLegend, renderTopThree } from '../../remotion/src/features/data-cards/all47-svg';
import { resolveTileScale } from '../../remotion/src/features/data-cards/tile-scale';
import { rankingRows } from './template-ranking-bars';
import { assertRankingRows, sampleRankingChart, type RankingChart } from './template-ranking-data';
import { SAMPLE_FRAME, sampleFrame } from './template-sample-frame';

export const DISTRIBUTION_MAP_SAMPLE_ID = 'maximum-temperature-map';
// Same prefecture boundaries the buzz-map cards draw from.
const PREFECTURE_TOPOLOGY = path.resolve(__dirname, '../../remotion/public/prefecture.topojson');
// Top three in the upper Sea of Japan corner (as on the tile map); Okinawa below it, fitted to the islands.
const TOP_THREE = { top: 286, width: 420, rowGap: 76 } as const;
const OKINAWA_BOX = { x: SAMPLE_FRAME.left, y: 530, width: 560, height: 190 } as const;
// The island arc runs south-west to north-east, so a rectangle leaves two empty corners: one slanted
// line along the arc's mainland side separates it instead, and the name sits in the empty upper-left.
// The box keeps a wide strip of sea between the arc and the mainland so the rule stands clear of both.
const OKINAWA_RULE_GAP = 40;
const OKINAWA_LABEL_GAP = 20;

const pointsOf = (paths: { d: string }[]) =>
  paths.flatMap((p) => [...p.d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) })));

/**
 * Slanted rule between the island arc and the mainland: parallel to the arc's west-east chord and
 * a fixed gap off the arc, never past the middle of the sea between them along the chord's span.
 */
function okinawaRule(okinawa: { d: string }[], mainland: { d: string }[]) {
  const points = pointsOf(okinawa);
  const west = points.reduce((a, p) => (p.x < a.x ? p : a)), east = points.reduce((a, p) => (p.x > a.x ? p : a));
  const length = Math.hypot(east.x - west.x, east.y - west.y);
  const along = { x: (east.x - west.x) / length, y: (east.y - west.y) / length };
  const normal = { x: -along.y, y: along.x }; // points down-right, toward the mainland
  const side = (p: { x: number; y: number }) => (p.x - west.x) * normal.x + (p.y - west.y) * normal.y;
  const span = (p: { x: number; y: number }) => { const t = (p.x - west.x) * along.x + (p.y - west.y) * along.y; return t >= 0 && t <= length; };
  const islands = Math.max(...points.map(side));
  const nearest = Math.min(...pointsOf(mainland).filter(span).map(side).filter((d) => d > islands));
  const by = islands + Math.min(OKINAWA_RULE_GAP, Number.isFinite(nearest) ? (nearest - islands) / 2 : Infinity);
  const above = Math.min(...points.map(side)) - OKINAWA_LABEL_GAP;
  const at = (p: { x: number; y: number }, d: number) => ({ x: Math.round(p.x + normal.x * d), y: Math.round(p.y + normal.y * d) });
  return { from: at(west, by), to: at(east, by), label: at({ x: (west.x + east.x) / 2, y: (west.y + east.y) / 2 }, above) };
}

/**
 * Real-shape map: the buzz-map geometry (mainland filling the frame, Okinawa fitted to the spare
 * Sea of Japan corner and set off by a slanted line) coloured by the metric's authored scale. The top three and the legend are the tile map's.
 */
export async function renderDistributionMap(raw: unknown, theme: ChartTheme = LIGHT_THEME) {
  return renderDistributionMapChart(sampleRankingChart({ data: rankingRows(raw) }), theme);
}

export function renderDistributionMapChart(chart: RankingChart, theme: ChartTheme = LIGHT_THEME) {
  const rows = assertRankingRows(chart.rows);
  const values = new Map(rows.map((row) => [row.area_code.slice(0, 2), row.value]));
  const scale = resolveTileScale(chart.presentation, rows.map((row) => row.value), chart.display);
  if (!scale) throw Error('地図の配色を解決できません。');
  const topology = JSON.parse(fs.readFileSync(PREFECTURE_TOPOLOGY, 'utf8')) as Topology;
  const geo = computeBuzzMapGeo(topology, null, { level: 'pref', ratio: '45', type: 'A', insetBox: OKINAWA_BOX });
  const drawn = [...geo.mainland, ...(geo.inset ?? [])];
  const codes = new Set(drawn.map((shape) => shape.code.slice(0, 2)));
  if (codes.size !== 47 || rows.some((row) => !codes.has(row.area_code.slice(0, 2))))
    throw Error('県境データと47都道府県の値が対応しません。');
  const shape = (p: { code: string; d: string }) => {
    const value = values.get(p.code.slice(0, 2))!;
    return `<path data-pref="${p.code.slice(0, 2)}" data-value="${value}" d="${p.d}" fill="${scale.colorAt(value)}" stroke="${theme.mapBorder}" stroke-width="${theme.outline ? 1.6 : 1.2}" stroke-linejoin="round"/>`;
  };
  const rule = okinawaRule(geo.inset ?? [], geo.mainland);
  const inset = `<line data-okinawa-rule="" x1="${rule.from.x}" y1="${rule.from.y}" x2="${rule.to.x}" y2="${rule.to.y}" stroke="${theme.line}" stroke-width="2"/>
    <text x="${rule.label.x}" y="${rule.label.y}" text-anchor="middle" font-size="24" fill="${theme.muted}">沖縄</text>`;
  const all = rows.map((row) => ({ areaCode: row.area_code, areaName: row.area_name, value: row.value }));
  const format = mapValueFormatter(all.map((r) => r.value));
  const topThree = renderTopThree(all, { x: SAMPLE_FRAME.left, ...TOP_THREE, unit: chart.unit, format, theme });
  const legend = renderClassLegend(scale, all.map((r) => r.value), { right: SAMPLE_FRAME.right, bottom: 1250, format: scale.formatBoundary ?? format, theme });
  return sampleFrame({
    title: chart.title,
    meta: `${chart.yearLabel} · 単位：${chart.unit}`,
    note: chart.note,
    source: chart.source,
    ariaLabel: `${chart.title}・全47都道府県の地図`,
    attributes: 'data-image-template="choropleth"',
    body: `<g data-map="mainland">${geo.mainland.map(shape).join('')}</g>${inset}<g data-map="okinawa">${(geo.inset ?? []).map(shape).join('')}</g>${topThree}${legend}`,
    theme,
  });
}
