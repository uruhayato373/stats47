import fs from 'node:fs';
import path from 'node:path';
import type { Topology } from 'topojson-specification';
import { BRAND } from '../../web/src/features/ogp/brand';
import { computeBuzzMapGeo } from '../../remotion/src/features/buzz-map/geo';
import { resolveTileScale } from '../../remotion/src/features/data-cards/tile-scale';
import { rankingRows } from './template-ranking-bars';
import { RANKING_SAMPLE_METRIC, RANKING_SAMPLE_YEAR, rankingSampleLabels } from './template-ranking-data';
import { escapeXml, sampleFrame } from './template-sample-frame';

export const DISTRIBUTION_MAP_SAMPLE_ID = 'maximum-temperature-map';
// Same prefecture boundaries the buzz-map cards draw from.
const PREFECTURE_TOPOLOGY = path.resolve(__dirname, '../../remotion/public/prefecture.topojson');
const LEGEND = { right: 1016, bottom: 1250, rowHeight: 44, swatch: 30, width: 330 } as const;

/**
 * Real-shape map: the buzz-map geometry (mainland filling the frame, a large Okinawa inset in the
 * Sea of Japan corner) coloured by the metric's authored scale, with a buzz-map style legend card.
 */
export async function renderDistributionMap(raw: unknown) {
  const rows = rankingRows(raw);
  const label = rankingSampleLabels();
  const values = new Map(rows.map((row) => [row.area_code.slice(0, 2), row.value]));
  const scale = resolveTileScale(RANKING_SAMPLE_METRIC.visualization, rows.map((row) => row.value), RANKING_SAMPLE_METRIC.display);
  if (!scale) throw Error('地図の配色を解決できません。');
  const topology = JSON.parse(fs.readFileSync(PREFECTURE_TOPOLOGY, 'utf8')) as Topology;
  const geo = computeBuzzMapGeo(topology, null, { level: 'pref', ratio: '45', type: 'A' });
  const drawn = [...geo.mainland, ...(geo.inset ?? [])];
  const codes = new Set(drawn.map((shape) => shape.code.slice(0, 2)));
  if (codes.size !== 47 || rows.some((row) => !codes.has(row.area_code.slice(0, 2))))
    throw Error('県境データと47都道府県の値が対応しません。');
  const shape = (p: { code: string; d: string }) => {
    const value = values.get(p.code.slice(0, 2))!;
    return `<path data-pref="${p.code.slice(0, 2)}" data-value="${value}" d="${p.d}" fill="${scale.colorAt(value)}" stroke="${BRAND.white}" stroke-width="1.2" stroke-linejoin="round"/>`;
  };
  const box = geo.insetBox!;
  const inset = `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="10" fill="none" stroke="${BRAND.line}" stroke-width="2"/>
    <text x="${box.x + 16}" y="${box.y + 34}" font-size="24" fill="${BRAND.muted}">沖縄</text>`;
  // Legend card: one row per class with its range and the number of prefectures in it.
  const format = scale.formatBoundary ?? ((v: number) => String(v));
  const classes = scale.colors.length
    ? scale.colors.map((color, i) => {
      const lo = scale.boundaries[i], hi = scale.boundaries[i + 1];
      const count = rows.filter((row) => (i === scale.colors.length - 1 ? row.value >= lo && row.value <= hi : row.value >= lo && row.value < hi)).length;
      return { color, label: `${format(lo)}〜${format(hi)}`, count };
    }).reverse()
    : [];
  const legendTop = LEGEND.bottom - classes.length * LEGEND.rowHeight;
  const legendLeft = LEGEND.right - LEGEND.width;
  const legend = classes.map((c, i) => {
    const y = legendTop + i * LEGEND.rowHeight;
    return `<g data-legend-row="${i}"><rect x="${legendLeft}" y="${y}" width="${LEGEND.swatch}" height="${LEGEND.swatch}" rx="4" fill="${c.color}"/><text x="${legendLeft + LEGEND.swatch + 14}" y="${y + 23}" font-size="24">${escapeXml(c.label)}</text><text x="${LEGEND.right}" y="${y + 23}" text-anchor="end" font-size="24" font-weight="700">${c.count}県</text></g>`;
  }).join('');
  return sampleFrame({
    title: RANKING_SAMPLE_METRIC.title,
    meta: `${RANKING_SAMPLE_YEAR}年 · 単位：${label.unit}`,
    note: label.subtitle || undefined,
    source: label.source,
    ariaLabel: `${RANKING_SAMPLE_METRIC.title}・全47都道府県の地図`,
    body: `<g data-map="mainland">${geo.mainland.map(shape).join('')}</g>${inset}<g data-map="okinawa">${(geo.inset ?? []).map(shape).join('')}</g>${legend}`,
  });
}
