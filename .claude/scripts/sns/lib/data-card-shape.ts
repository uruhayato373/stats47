import { geoArea, geoMercator, geoPath } from 'd3-geo';
import type { Feature, Geometry } from 'geojson';

/** Preserve real boundaries; label a mainland crop explicitly when distant islands dominate. */
export function prefectureShape(prefecture: Feature<Geometry>) {
  const projection = geoMercator().fitExtent(
    [
      [10, 10],
      [310, 310],
    ],
    prefecture
  );
  let displayed = prefecture;
  let cropped = false;
  if (prefecture.geometry.type === 'MultiPolygon') {
    const polygons = prefecture.geometry.coordinates.map((coordinates) => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'Polygon' as const, coordinates },
    }));
    const largest = polygons.toSorted((a, b) => geoArea(b) - geoArea(a))[0];
    if (!largest) throw new Error('県境データが空です');
    const [[x0, y0], [x1, y1]] = geoPath(projection).bounds(largest);
    if (Math.max(x1 - x0, y1 - y0) < 135) {
      displayed = largest;
      cropped = true;
      projection.fitExtent(
        [
          [10, 10],
          [310, 310],
        ],
        displayed
      );
    }
  }
  const path = geoPath(projection)(displayed);
  if (!path || path.includes('NaN')) throw new Error('県シルエットが不正です');
  return {
    path,
    note: cropped ? '主な陸地を表示（離島省略）' : '都道府県の境界データより',
  };
}
