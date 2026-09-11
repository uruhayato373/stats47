import { landslideMeshBounds, type GeoLandslidePrefDetail } from '@stats47/gis';

import type { FeatureCollection, Polygon } from 'geojson';
export const LANDSLIDE_CLASS_LABELS = [
  '中心が入力面外（安全を示さない）',
  '警戒面内・特別面外',
  '特別警戒面内',
] as const;
export function buildGeoLandslideMapModel(
  detail: Extract<GeoLandslidePrefDetail, { status: 'available' }>
) {
  let west = 180,
    south = 90,
    east = -180,
    north = -90,
    best = detail.meshes[0]!;
  const features: FeatureCollection<Polygon>['features'] = detail.meshes.map(
    (m) => {
      const b = landslideMeshBounds(m[0]);
      if (!b) throw new Error('invalid landslide mesh');
      west = Math.min(west, b[0]);
      south = Math.min(south, b[1]);
      east = Math.max(east, b[2]);
      north = Math.max(north, b[3]);
      if (m[2] > best[2]) best = m;
      return {
        type: 'Feature',
        id: `${detail.areaCode}:${String(m[1]).padStart(5, '0')}:${m[0]}`,
        properties: {
          meshCode: m[0],
          population2020: m[2] / 10000,
          mask: m[3],
          centerClass: m[3] & 56 ? 2 : m[3] ? 1 : 0,
          boundaryCell: m[5] > 0 && m[4] === 0,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [b[0], b[1]],
              [b[2], b[1]],
              [b[2], b[3]],
              [b[0], b[3]],
              [b[0], b[1]],
            ],
          ],
        },
      };
    }
  );
  const b = landslideMeshBounds(best[0])!;
  return {
    collection: {
      type: 'FeatureCollection',
      features,
    } as FeatureCollection<Polygon>,
    center: [(b[1] + b[3]) / 2, (b[0] + b[2]) / 2] as [number, number],
    bounds: [
      [south, west],
      [north, east],
    ] as [[number, number], [number, number]],
  };
}
