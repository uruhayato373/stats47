import { geoCentroid, geoMercator, geoPath, type GeoProjection } from 'd3-geo';
import type { Feature, MultiPolygon } from 'geojson';
import { BRAND } from '../../web/src/features/ogp/brand';
import { readPrefectureFeatures } from '../../../packages/visualization/src/server/generate-mini-prefecture-svg';
import { resolveChoroplethScale, createLegendFormatter } from '../../../packages/visualization/src/server';
import { rankingRows } from './template-ranking-bars';
import { SAMPLE_FRAME, sampleBodyTop, sampleFrame, escapeXml } from './template-sample-frame';
import { RANKING_SAMPLE_METRIC, RANKING_SAMPLE_YEAR, rankingSampleLabels } from './template-ranking-data';

export const DISTRIBUTION_MAP_SAMPLE_ID = 'maximum-temperature-map';
const OKINAWA = 47;
// Okinawa sits in the empty Sea of Japan corner, at its own projection but the same colour scale.
const BODY_TOP = sampleBodyTop(true);
const LEGEND = { x: SAMPLE_FRAME.left, y: SAMPLE_FRAME.bodyBottom - 72, width: SAMPLE_FRAME.right - SAMPLE_FRAME.left, height: 32 } as const;
const MAINLAND_BOX = [[96, BODY_TOP + 10], [SAMPLE_FRAME.right, LEGEND.y - 30]] as const;
const OKINAWA_BOX = { x: SAMPLE_FRAME.left, y: BODY_TOP + 10, width: 300, height: 240 } as const;
// Remote islands far from the main islands would shrink every prefecture; they carry no separate value.
const MAINLAND_LATITUDE_MIN = 30;

const prefCode = (feature: Feature) => Number(String(feature.properties?.N03_007 ?? '').slice(0, 2));
function mainlandOnly(feature: Feature): Feature | null {
  const geometry = feature.geometry;
  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') return null;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const kept = polygons.filter((coordinates) => geoCentroid({ type: 'Polygon', coordinates })[1] >= MAINLAND_LATITUDE_MIN);
  if (!kept.length) return null;
  const multi: MultiPolygon = { type: 'MultiPolygon', coordinates: kept };
  return { ...feature, geometry: multi };
}
// The prefecture has one value and colour; the inset frames the Okinawa Island group so it stays
// legible at 320px. Sakishima (west) and Daito (east) would shrink the main island to a dot.
const OKINAWA_ISLAND_LONGITUDE = [126.5, 130] as const;
function okinawaInset(feature: Feature): Feature {
  const geometry = feature.geometry;
  if (geometry.type !== 'MultiPolygon') return feature;
  const multi: MultiPolygon = { type: 'MultiPolygon', coordinates: geometry.coordinates.filter((coordinates) => {
    const longitude = geoCentroid({ type: 'Polygon', coordinates })[0];
    return longitude >= OKINAWA_ISLAND_LONGITUDE[0] && longitude < OKINAWA_ISLAND_LONGITUDE[1];
  }) };
  return { ...feature, geometry: multi };
}
const pathOf =(projection: GeoProjection) => geoPath(projection).digits(1);

/** Exact prefecture shapes coloured by the ranking page's resolved scale for the same metric. */
export async function renderDistributionMap(raw: unknown) {
  const rows = rankingRows(raw);
  const label = rankingSampleLabels();
  const values = new Map(rows.map((row) => [Number(row.area_code.slice(0, 2)), row.value]));
  const scale = await resolveChoroplethScale(RANKING_SAMPLE_METRIC.visualization, rows.map((row) => ({ areaCode: row.area_code, value: row.value })));
  if (!scale.domain) throw Error('地図の配色範囲を解決できません。');
  const midpoint = 'midpoint' in scale ? scale.midpoint : undefined;
  const format = createLegendFormatter(
    [...scale.boundaries, ...(midpoint === undefined ? [] : [midpoint])],
    RANKING_SAMPLE_METRIC.display?.conversionFactor ?? 1,
    scale.method === 'threshold' ? undefined : RANKING_SAMPLE_METRIC.display?.decimalPlaces
  );
  const features = readPrefectureFeatures();
  if (new Set(features.map(prefCode)).size !== 47 || rows.some((row) => !features.some((f) => prefCode(f) === Number(row.area_code.slice(0, 2)))))
    throw Error('県境データと47都道府県の値が対応しません。');
  const mainland = features.filter((f) => prefCode(f) !== OKINAWA).map(mainlandOnly).filter((f): f is Feature => f !== null);
  const okinawa = okinawaInset(features.find((f) => prefCode(f) === OKINAWA)!);
  const mainlandPath = pathOf(geoMercator().fitExtent(MAINLAND_BOX.map((p) => [...p]) as [[number, number], [number, number]], { type: 'FeatureCollection', features: mainland }));
  const okinawaPath = pathOf(geoMercator().fitExtent([[OKINAWA_BOX.x + 16, OKINAWA_BOX.y + 16], [OKINAWA_BOX.x + OKINAWA_BOX.width - 16, OKINAWA_BOX.y + OKINAWA_BOX.height - 16]], okinawa));
  const shape = (feature: Feature, d: string | null) => {
    const code = prefCode(feature), value = values.get(code)!;
    return `<path data-pref="${String(code).padStart(2, '0')}" data-value="${value}" d="${d ?? ''}" fill="${scale.colorAtValue(value)}" stroke="${BRAND.white}" stroke-width="1.2" stroke-linejoin="round"/>`;
  };
  const [lo, hi] = scale.domain;
  const continuous = scale.method === 'continuous';
  const steps = continuous ? 100 : scale.colors.length;
  const swatches = Array.from({ length: steps }, (_, i) => {
    const fill = continuous ? scale.colorAtValue(lo + (hi - lo) * i / (steps - 1)) : scale.colors[i];
    return `<rect x="${LEGEND.x + LEGEND.width * i / steps}" y="${LEGEND.y}" width="${LEGEND.width / steps + 0.5}" height="${LEGEND.height}" fill="${fill}"/>`;
  });
  const marks = (continuous ? [lo, hi] : scale.boundaries).map((value, i, all) => {
    const x = LEGEND.x + LEGEND.width * i / (all.length - 1);
    const anchor = i === 0 ? 'start' : i === all.length - 1 ? 'end' : 'middle';
    return `<text x="${x}" y="${LEGEND.y + LEGEND.height + 36}" text-anchor="${anchor}" font-size="28" fill="${BRAND.muted}">${escapeXml(format(value))}</text>`;
  });
  return sampleFrame({
    title: RANKING_SAMPLE_METRIC.title, meta: `${RANKING_SAMPLE_YEAR}年 · 単位：${label.unit}`, note: label.subtitle || undefined, source: label.source,
    ariaLabel: `${RANKING_SAMPLE_METRIC.title}・全47都道府県の地図`,
    body: `<g data-map="mainland">${mainland.map((f) => shape(f, mainlandPath(f))).join('')}</g>
      <rect x="${OKINAWA_BOX.x}" y="${OKINAWA_BOX.y}" width="${OKINAWA_BOX.width}" height="${OKINAWA_BOX.height}" fill="none" stroke="${BRAND.line}" stroke-width="2"/>
      <g data-map="okinawa">${shape(okinawa, okinawaPath(okinawa))}</g>
      ${swatches.join('')}${marks.join('')}`,
  });
}
