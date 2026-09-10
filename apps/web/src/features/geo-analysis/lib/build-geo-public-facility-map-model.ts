import {
  mesh1000BoundsFromCode,
  type GeoPublicFacilityPrefDetail,
} from '@stats47/gis';

import type { PublicFacilityGroup } from './geo-public-facility-evidence';
import type { FeatureCollection, Polygon } from 'geojson';
import type { LatLngBoundsExpression } from 'leaflet';

export function buildGeoPublicFacilityMapModel(
  detail: GeoPublicFacilityPrefDetail,
  group: PublicFacilityGroup
) {
  const index = group === 'administrative' ? 5 : 8;
  const facilities = new Map(
    detail.facilities.map((point) => [point[0], point])
  );
  const nearestIds = new Set(detail.meshes.map((mesh) => mesh[index]));
  const collection: FeatureCollection<Polygon> = {
    type: 'FeatureCollection',
    features: detail.meshes.map((mesh) => {
      const [id, , , population2020, population2050] = mesh;
      const bounds = mesh1000BoundsFromCode(id);
      if (!bounds) throw new Error(`Invalid 1km mesh: ${id}`);
      const [west, south, east, north] = bounds;
      const facility = facilities.get(mesh[index]);
      return {
        type: 'Feature',
        id,
        properties: {
          id,
          population2020,
          population2050,
          change:
            population2020 > 0
              ? ((population2050 - population2020) / population2020) * 100
              : null,
          facilityName: facility?.[4] ?? '',
          facilityId: facility?.[1] ?? '',
          distanceMeters: mesh[index + 1],
          band: mesh[index + 2],
          outsidePrefecture: facility
            ? facility[2].slice(0, 2) !== detail.areaCode.slice(0, 2)
            : false,
        },
        geometry: {
          type: 'Polygon',
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
      };
    }),
  };
  const bounds: LatLngBoundsExpression = [
    [
      Math.min(...detail.meshes.map((m) => m[2])) - 1 / 240,
      Math.min(...detail.meshes.map((m) => m[1])) - 1 / 160,
    ],
    [
      Math.max(...detail.meshes.map((m) => m[2])) + 1 / 240,
      Math.max(...detail.meshes.map((m) => m[1])) + 1 / 160,
    ],
  ];
  const belongsToGroup = (
    point: GeoPublicFacilityPrefDetail['facilities'][number]
  ) =>
    group === 'administrative'
      ? ['1', '2', '3'].includes(point[3])
      : ['4', '5'].includes(point[3]);
  return {
    collection,
    bounds,
    sourceFacilities: detail.facilities.filter(
      (point) =>
        point[2].slice(0, 2) === detail.areaCode.slice(0, 2) &&
        belongsToGroup(point)
    ),
    nearestFacilities: detail.facilities.filter((point) =>
      nearestIds.has(point[0])
    ),
  };
}
