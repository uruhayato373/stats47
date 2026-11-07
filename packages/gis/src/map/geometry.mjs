/**
 * The one place that turns boundary data into a drawing's coordinates: topology to features, the Mercator
 * projection fitted to a box, and the largest polygon of a prefecture. Every static image and video map builds on
 * this, so a map differs from another only in what it draws on top. `.mjs` because plain Node scripts use it too.
 * Interactive maps on the site keep d3's own projection (see check-map-geometry).
 */
import { geoArea, geoMercator } from 'd3-geo';
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
