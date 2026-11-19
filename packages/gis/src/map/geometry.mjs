/**
 * The one place that turns boundary data into a drawing's coordinates: topology to features, the Mercator
 * projection fitted to a box, and the largest polygon of a prefecture. Every static image and video map builds on
 * this, so a map differs from another only in what it draws on top. `.mjs` because plain Node scripts use it too.
 * Interactive maps on the site keep d3's own projection (see check-map-geometry).
 */
import { geoArea, geoCentroid, geoMercator } from 'd3-geo';
import { feature } from 'topojson-client';

const EMPTY = { type: 'FeatureCollection', features: [] };

/** A topology's features, from the named object or from its first one when no name is given. */
export function topologyFeatures(topology, objectName = Object.keys(topology.objects)[0]) {
  return objectName ? feature(topology, topology.objects[objectName]) : EMPTY;
}

/** A Mercator projection that fits `target` inside `extent`, [[x0, y0], [x1, y1]]. */
export const fittedMercator = (extent, target) => geoMercator().fitExtent(extent, target);

/** A Mercator projection scaled so that `target` is `height` tall. */
export const heightFittedMercator = (height, target) => geoMercator().fitHeight(height, target);

/** A Mercator projection with a fixed centre and scale, for frames that must keep the same position across years. */
export const centeredMercator = ({ center, scale, translate }) => geoMercator().center(center).scale(scale).translate(translate);

/** A Mercator projection to configure step by step, for the few maps that rotate or fit conditionally. */
export const mercator = () => geoMercator();

const polygonOf = (coordinates) => ({ type: 'Polygon', coordinates });

/** The feature with only its largest polygon: the mainland of a prefecture, without its remote islands. */
export function largestPolygon(target) {
  if (target.geometry.type !== 'MultiPolygon') return target;
  const coordinates = target.geometry.coordinates.reduce((best, part) => (geoArea(polygonOf(part)) > geoArea(polygonOf(best)) ? part : best));
  return { ...target, geometry: polygonOf(coordinates) };
}

/**
 * 本土の範囲 (経度・緯度)。小笠原・大東諸島・南西諸島の外れ島はこの外にあり、本土の地図には描かない。
 * 本土を固定フレームで投影する地図 (buzz-map) と、本土だけを描くサムネイルが同じ範囲を読む。
 */
export const MAINLAND_BBOX = { west: 128.3, east: 146.3, south: 30.6, north: 45.9 };

/** 経度・緯度が本土の範囲内か。範囲は既定で MAINLAND_BBOX。 */
export const inMainlandBox = (lon, lat, bbox = MAINLAND_BBOX) => lon >= bbox.west && lon <= bbox.east && lat >= bbox.south && lat <= bbox.north;

/** 形全体の重心が本土の範囲内か (県や市区町村を丸ごと残すか落とすかの判定)。 */
export function isMainlandFeature(target, bbox = MAINLAND_BBOX) {
  const [lon, lat] = geoCentroid(target);
  return inMainlandBox(lon, lat, bbox);
}

/** 多角形 1 つ (外周と穴の輪の並び) の重心が本土の範囲内か (県の中の島ごとの判定)。 */
export const isMainlandPolygon = (coordinates, bbox = MAINLAND_BBOX) => isMainlandFeature(polygonOf(coordinates), bbox);

const EARTH_RADIUS_KM = 6371.0088;

/** 多角形 1 つ (外周と穴の輪の並び) の面積 (km²)。球面上の面積なので投影や縮尺に依らない。 */
export const polygonAreaKm2 = (coordinates) => geoArea(polygonOf(coordinates)) * EARTH_RADIUS_KM ** 2;

/**
 * 県ごとの最大の多角形 (本土や主島) は残し、それ以外で面積が minAreaKm2 未満の島を外す。
 * 小さな島は縮小した図では点にもならず、輪郭だけを重くする。Polygon はそのまま返す。
 */
export function dropSmallIslands(target, minAreaKm2) {
  if (target.geometry.type !== 'MultiPolygon') return target;
  const areas = target.geometry.coordinates.map(polygonAreaKm2);
  const largest = areas.indexOf(Math.max(...areas));
  const kept = target.geometry.coordinates.filter((_, index) => index === largest || areas[index] >= minAreaKm2);
  return { ...target, geometry: kept.length === 1 ? polygonOf(kept[0]) : { type: 'MultiPolygon', coordinates: kept } };
}
