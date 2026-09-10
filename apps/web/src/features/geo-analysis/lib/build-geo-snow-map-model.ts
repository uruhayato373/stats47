import { snowMeshBounds, type GeoSnowPrefDetail } from '@stats47/gis';

import type { FeatureCollection, Polygon } from 'geojson';
export const SNOW_CLASS_LABELS = [
  '中心が入力区域外',
  '通常の豪雪指定区域',
  '特別豪雪区域',
] as const;
export function buildGeoSnowMapModel(detail: Pick<GeoSnowPrefDetail, 'areaCode' | 'meshes'>) {
  let west = Infinity,
    south = Infinity,
    east = -Infinity,
    north = -Infinity,
    largest = -1;
  let center: [number, number] = [36, 138];
  const features: FeatureCollection<Polygon>['features'] = detail.meshes.map(
    (m) => {
      const bounds = snowMeshBounds(m[0]);
      if (!bounds) throw new Error('Invalid quarter mesh');
      const [w, s, e, n] = bounds;
      west = Math.min(west, w);
      south = Math.min(south, s);
      east = Math.max(east, e);
      north = Math.max(north, n);
      if (m[2] > largest) {
        largest = m[2];
        center = [(s + n) / 2, (w + e) / 2];
      }
      const id = `${detail.areaCode}:${String(m[1]).padStart(5, '0')}:${m[0]}`;
      return {
        type: 'Feature',
        id,
        properties: {
          id,
          meshCode: m[0],
          population2020: m[2] / 10000,
          centerClass: m[3],
          boundaryCell: (m[4] & 16) !== 0,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [w, s],
              [e, s],
              [e, n],
              [w, n],
              [w, s],
            ],
          ],
        },
      };
    }
  );
  return {
    collection: {
      type: 'FeatureCollection',
      features,
    } as FeatureCollection<Polygon>,
    center,
    bounds: [
      [south, west],
      [north, east],
    ] as [[number, number], [number, number]],
  };
}
