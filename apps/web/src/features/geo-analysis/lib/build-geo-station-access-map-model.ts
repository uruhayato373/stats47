import type { GeoStationAccessPrefDetail } from '@stats47/gis';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type { LatLngBoundsExpression } from 'leaflet';

export interface GeoStationAccessMeshProperties {
  meshId: string;
  population2020: number;
  population2050: number;
  changeRate: number | null;
  accessible: boolean;
}

export interface GeoStationAccessMapModel {
  featureCollection: FeatureCollection<
    Polygon,
    GeoStationAccessMeshProperties
  >;
  bounds: LatLngBoundsExpression;
}

export type GeoStationAccessMapFocus = 'all' | 'accessible' | 'population-core';

function toDegrees(value: number): number {
  return value / 1_000_000;
}

/** Compact tupleをLeafletへ渡すGeoJSONへ決定的に変換する。 */
export function buildGeoStationAccessMapModel(
  detail: GeoStationAccessPrefDetail,
  focus: GeoStationAccessMapFocus = 'all'
): GeoStationAccessMapModel {
  const features = detail.meshes.map((mesh) => {
    const [
      meshId,
      westE6,
      southE6,
      eastE6,
      northE6,
      population2020,
      population2050,
      accessible,
    ] = mesh;
    const west = toDegrees(westE6);
    const south = toDegrees(southE6);
    const east = toDegrees(eastE6);
    const north = toDegrees(northE6);
    return {
      type: 'Feature' as const,
      id: meshId,
      properties: {
        meshId,
        population2020,
        population2050,
        changeRate:
          population2020 > 0
            ? Number(
                (
                  ((population2050 - population2020) / population2020) *
                  100
                ).toFixed(1)
              )
            : null,
        accessible: accessible === 1,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ],
        ],
      },
    } satisfies Feature<Polygon, GeoStationAccessMeshProperties>;
  });

  let focusMeshes = [...detail.meshes];
  if (focus === 'accessible') {
    const accessibleMeshes = focusMeshes.filter((mesh) => mesh[7] === 1);
    if (accessibleMeshes.length > 0) focusMeshes = accessibleMeshes;
  } else if (focus === 'population-core' && focusMeshes.length > 50) {
    const sortedLongitudes = focusMeshes
      .map((mesh) => (mesh[1] + mesh[3]) / 2)
      .sort((a, b) => a - b);
    const sortedLatitudes = focusMeshes
      .map((mesh) => (mesh[2] + mesh[4]) / 2)
      .sort((a, b) => a - b);
    const middle = Math.floor(focusMeshes.length / 2);
    const medianLongitude = sortedLongitudes[middle] ?? 0;
    const medianLatitude = sortedLatitudes[middle] ?? 0;
    const longitudeScale = Math.cos(
      (medianLatitude / 1_000_000) * (Math.PI / 180)
    );
    focusMeshes.sort((a, b) => {
      const distance = (mesh: GeoStationAccessPrefDetail['meshes'][number]) => {
        const longitude = (mesh[1] + mesh[3]) / 2;
        const latitude = (mesh[2] + mesh[4]) / 2;
        return (
          ((longitude - medianLongitude) * longitudeScale) ** 2 +
          (latitude - medianLatitude) ** 2
        );
      };
      return distance(a) - distance(b);
    });
    focusMeshes = focusMeshes.slice(0, Math.ceil(focusMeshes.length * 0.95));
  }

  const minLongitude = Math.min(...focusMeshes.map((mesh) => mesh[1]));
  const minLatitude = Math.min(...focusMeshes.map((mesh) => mesh[2]));
  const maxLongitude = Math.max(...focusMeshes.map((mesh) => mesh[3]));
  const maxLatitude = Math.max(...focusMeshes.map((mesh) => mesh[4]));

  return {
    featureCollection: {
      type: 'FeatureCollection',
      features,
    },
    bounds: [
      [toDegrees(minLatitude), toDegrees(minLongitude)],
      [toDegrees(maxLatitude), toDegrees(maxLongitude)],
    ],
  };
}
