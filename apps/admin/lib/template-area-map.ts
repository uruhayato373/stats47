import type { Topology } from 'topojson-specification';
import { computeBuzzMapGeo } from '../../remotion/src/features/buzz-map/geo';
import { LIGHT_THEME, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { renderClassLegend, renderTopThree } from '../../remotion/src/features/data-cards/all47-svg';
import { resolveTileScale } from '../../remotion/src/features/data-cards/tile-scale';
import { areasOf, scopeAttributes, type AreaChart } from './template-area-scope';
import { SAMPLE_FRAME, fitTitleSize, sampleBodyTop, sampleFrame } from './template-sample-frame';

// The shape above, the top three and the legend in a band below it, for a prefecture of any outline.
const BODY_BOTTOM = 1000;
const AREA_COUNT_UNIT = '地域';
const BAND = { top: 1012, rowGap: 52, width: 440, legendBottom: 1250 } as const;

const pointsOf = (d: string) => [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));

/** The prefecture whose boundary file a scope draws. The whole nation's municipalities do not fit one image. */
function prefectureOf(chart: AreaChart) {
  const { scope } = chart;
  if (scope.level === 'prefecture' || scope.within.kind === 'nation') throw Error('市区町村の地図は 1 つの県の中だけを描きます。');
  return scope.within.prefCode;
}

/**
 * One prefecture's municipalities coloured by the metric's scale, joined by area code.
 * The topology must be the scope's WardMode (fetchMunicipalityTopologyForWardMode): the merged file has no
 * wards and the split file no whole cities, so a mismatch fails here rather than drawing a blank city.
 */
export function renderAreaMapChart(chart: AreaChart, topology: Topology, theme: ChartTheme = LIGHT_THEME) {
  const areas = areasOf(chart.scope);
  const geo = computeBuzzMapGeo(topology, null, { level: `muni:${prefectureOf(chart)}`, ratio: '45', type: 'A' });
  const shapes = new Map<string, { d: string; points: { x: number; y: number }[] }>();
  for (const shape of geo.mainland) {
    if (!areas.has(shape.code)) continue;
    const known = shapes.get(shape.code), points = pointsOf(shape.d);
    if (known) { known.d += shape.d; known.points.push(...points); } else shapes.set(shape.code, { d: shape.d, points });
  }
  const unmatched = chart.rows.filter((row) => !shapes.has(row.area_code)).map((row) => row.area_name);
  if (unmatched.length) throw Error(`境界データに無い地域: ${unmatched.join(' ')}`);
  const scale = resolveTileScale(chart.presentation, chart.rows.map((row) => row.value), chart.display);
  if (!scale) throw Error('配色を解決できません。');
  const rows = new Map(chart.rows.map((row) => [row.area_code, row]));
  const all = [...shapes.values()].flatMap((shape) => shape.points);
  const x0 = Math.min(...all.map((p) => p.x)), x1 = Math.max(...all.map((p) => p.x));
  const y0 = Math.min(...all.map((p) => p.y)), y1 = Math.max(...all.map((p) => p.y));
  const top = sampleBodyTop(Boolean(chart.note)) + 8;
  const width = SAMPLE_FRAME.right - SAMPLE_FRAME.left, height = BODY_BOTTOM - top;
  const fit = Math.min(width / (x1 - x0), height / (y1 - y0));
  const dx = SAMPLE_FRAME.left + (width - (x1 - x0) * fit) / 2 - x0 * fit;
  const dy = top + (height - (y1 - y0) * fit) / 2 - y0 * fit;
  const paths = [...shapes].map(([code, shape]) => {
    const row = rows.get(code);
    return `<path data-area="${code}" data-value="${row?.value ?? ''}" d="${shape.d}" fill="${row ? scale.colorAt(row.value) : theme.wash}" stroke="${theme.mapBorder}" stroke-width="${(1.2 / fit).toFixed(3)}" stroke-linejoin="round"/>`;
  }).join('');
  const entries = chart.rows.map((row) => ({ areaCode: row.area_code, areaName: row.area_name, value: row.value }));
  const format = chart.formatValue;
  const band = renderTopThree(entries, { x: SAMPLE_FRAME.left, top: BAND.top, width: BAND.width, rowGap: BAND.rowGap, unit: chart.unit, format, theme, heading: '上位3' })
    + renderClassLegend(scale, entries.map((row) => row.value), { right: SAMPLE_FRAME.right, bottom: BAND.legendBottom, format: scale.formatBoundary ?? format, countUnit: AREA_COUNT_UNIT, theme });
  return sampleFrame({
    title: chart.title, titleSize: fitTitleSize(chart.title), meta: `${chart.yearLabel} · 単位：${chart.unit}`, note: chart.note, source: chart.source,
    attributes: `data-image-template="choropleth" ${scopeAttributes(chart.scope)}`,
    body: `<g data-map="municipality" transform="translate(${dx.toFixed(2)},${dy.toFixed(2)}) scale(${fit.toFixed(4)})">${paths}</g>${band}`,
    theme,
  });
}
