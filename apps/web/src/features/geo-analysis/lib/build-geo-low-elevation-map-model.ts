import {
  LOW_ELEVATION_BAND_LABELS,
  lowElevationBand,
  lowElevationMeshBounds,
  type GeoLowElevationPrefDetail,
} from '@stats47/gis';

import type { FeatureCollection, Polygon } from 'geojson';

/** 区分の判定基準。平均標高が主判定、最低標高は「メッシュ内に低地を含む」上限側の見積り。 */
export type LowElevationBasis = 'mean' | 'min';

export { LOW_ELEVATION_BAND_LABELS };

/** 県詳細から地図用のメッシュ地物を作る。区分は配信済みの標高から決定的に再計算する(表示専用)。 */
export function buildGeoLowElevationMapModel(
  detail: Pick<GeoLowElevationPrefDetail, 'areaCode' | 'meshes'>
) {
  let west = Infinity,
    south = Infinity,
    east = -Infinity,
    north = -Infinity,
    largest = -1;
  let center: [number, number] = [36, 138];
  const features: FeatureCollection<Polygon>['features'] = detail.meshes.map(
    ([meshId, city, population, mean, max, min]) => {
      const bounds = lowElevationMeshBounds(meshId);
      if (!bounds) throw new Error('Invalid third mesh');
      const [w, s, e, n] = bounds;
      west = Math.min(west, w);
      south = Math.min(south, s);
      east = Math.max(east, e);
      north = Math.max(north, n);
      if (population > largest) {
        largest = population;
        center = [(s + n) / 2, (w + e) / 2];
      }
      const id = `${city}:${meshId}`;
      return {
        type: 'Feature',
        id,
        properties: {
          id,
          meshCode: meshId,
          municipalityCode: city,
          population2020: population,
          meanElevation: mean,
          maxElevation: max,
          minElevation: min,
          meanBand: lowElevationBand(mean),
          minBand: lowElevationBand(min),
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
    collection: { type: 'FeatureCollection', features } as FeatureCollection<Polygon>,
    center,
    bounds: [
      [south, west],
      [north, east],
    ] as [[number, number], [number, number]],
  };
}

export function lowElevationTooltip(properties: Record<string, unknown>): string {
  const population = Number(properties.population2020).toLocaleString('ja-JP', {
    maximumFractionDigits: 4,
  });
  const mean = properties.meanElevation;
  const elevation =
    typeof mean === 'number'
      ? `平均標高 ${mean}m・最高 ${String(properties.maxElevation)}m・最低 ${String(properties.minElevation)}m`
      : '標高不明（低地にも非低地にも数えていません）';
  return `メッシュ ${String(properties.meshCode)}｜2020年人口 ${population}人｜${elevation}｜平均標高の区分：${LOW_ELEVATION_BAND_LABELS[Number(properties.meanBand)]}`;
}
