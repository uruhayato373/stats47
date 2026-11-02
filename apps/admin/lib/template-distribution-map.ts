import fs from 'node:fs';
import path from 'node:path';
import type { Topology } from 'topojson-specification';
import { BRAND } from '../../web/src/features/ogp/brand';
import { computeBuzzMapGeo } from '../../remotion/src/features/buzz-map/geo';
import { mapValueFormatter, renderClassLegend, renderTopThree } from '../../remotion/src/features/data-cards/all47-svg';
import { resolveTileScale } from '../../remotion/src/features/data-cards/tile-scale';
import { rankingRows } from './template-ranking-bars';
import { RANKING_SAMPLE_METRIC, RANKING_SAMPLE_YEAR, rankingSampleLabels } from './template-ranking-data';
import { SAMPLE_FRAME, sampleFrame } from './template-sample-frame';

export const DISTRIBUTION_MAP_SAMPLE_ID = 'maximum-temperature-map';
// Same prefecture boundaries the buzz-map cards draw from.
const PREFECTURE_TOPOLOGY = path.resolve(__dirname, '../../remotion/public/prefecture.topojson');
// Top three in the upper Sea of Japan corner (as on the tile map); Okinawa in a frame sized to the islands below it.
const TOP_THREE = { top: 286, width: 420, rowGap: 76 } as const;
const OKINAWA_BOX = { x: SAMPLE_FRAME.left, y: 560, width: 300, height: 240 } as const;

/**
 * Real-shape map: the buzz-map geometry (mainland filling the frame, Okinawa in a frame sized to the
 * islands) coloured by the metric's authored scale. The top three and the legend are the tile map's.
 */
export async function renderDistributionMap(raw: unknown) {
  const rows = rankingRows(raw);
  const label = rankingSampleLabels();
  const values = new Map(rows.map((row) => [row.area_code.slice(0, 2), row.value]));
  const scale = resolveTileScale(RANKING_SAMPLE_METRIC.visualization, rows.map((row) => row.value), RANKING_SAMPLE_METRIC.display);
  if (!scale) throw Error('地図の配色を解決できません。');
  const topology = JSON.parse(fs.readFileSync(PREFECTURE_TOPOLOGY, 'utf8')) as Topology;
  const geo = computeBuzzMapGeo(topology, null, { level: 'pref', ratio: '45', type: 'A', insetBox: OKINAWA_BOX });
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
  const all = rows.map((row) => ({ areaCode: row.area_code, areaName: row.area_name, value: row.value }));
  const format = mapValueFormatter(all.map((r) => r.value));
  const topThree = renderTopThree(all, { x: SAMPLE_FRAME.left, ...TOP_THREE, unit: label.unit, format });
  const legend = renderClassLegend(scale, all.map((r) => r.value), { right: SAMPLE_FRAME.right, bottom: 1250, format: scale.formatBoundary ?? format });
  return sampleFrame({
    title: RANKING_SAMPLE_METRIC.title,
    meta: `${RANKING_SAMPLE_YEAR}年 · 単位：${label.unit}`,
    note: label.subtitle || undefined,
    source: label.source,
    ariaLabel: `${RANKING_SAMPLE_METRIC.title}・全47都道府県の地図`,
    body: `<g data-map="mainland">${geo.mainland.map(shape).join('')}</g>${inset}<g data-map="okinawa">${(geo.inset ?? []).map(shape).join('')}</g>${topThree}${legend}`,
  });
}
