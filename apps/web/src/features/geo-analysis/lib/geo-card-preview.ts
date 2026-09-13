import { populationLayerColor } from './geo-layer-data';
import { landPointCategory } from './geo-spatial-evidence';

import type { GeoCardGeography, geoCardLandmarks } from './geo-card-geography';
import type { GeoAnalysisPrefDetail } from '@stats47/gis';

/** Static viewport of published meshes/points. Cropping never changes analysis results. */
export function buildGeoCardPreview(
  detail: GeoAnalysisPrefDetail,
  geography: GeoCardGeography,
  landmarks: ReturnType<typeof geoCardLandmarks> = [],
  singleLayer?: 'population' | 'land-price' | 'stations'
) {
  if (
    detail.slug === 'population-snow-designation' ||
    detail.slug === 'population-landslide-exposure'
  ) {
    throw new Error('This preview requires bounds-based population meshes');
  }
  const [west, south, east, north] = geography.bounds;
  const latitude = (south + north) / 2;
  const longitudeScale = Math.cos((latitude * Math.PI) / 180);
  const meshes = detail.meshes.filter(
    (mesh) =>
      mesh[3] / 1e6 >= west &&
      mesh[1] / 1e6 <= east &&
      mesh[4] / 1e6 >= south &&
      mesh[2] / 1e6 <= north
  );
  // One boundary-based projection for every analysis, including unpopulated land.
  // Reserve an extra 1km-cell margin so boundary-straddling cells stay intact.
  const scale = Math.min(
    568 / ((east - west) * longitudeScale),
    240 / (north - south)
  );
  const x = (e6: number) =>
    320 + (e6 / 1e6 - (west + east) / 2) * scale * longitudeScale;
  const y = (e6: number) => 180 - (e6 / 1e6 - (south + north) / 2) * scale;
  const paths = new Map<string, string[]>();
  const byId = new Map(detail.meshes.map((mesh) => [mesh[0], mesh]));
  for (const mesh of meshes) {
    if (singleLayer && singleLayer !== 'population') continue;
    const left = x(mesh[1]),
      top = y(mesh[4]),
      right = x(mesh[3]),
      bottom = y(mesh[2]);
    const included = (mesh[7] ?? 0) > 0;
    // Land previews emphasize point classifications with neutral mesh backgrounds.
    const color =
      singleLayer === 'population'
        ? populationLayerColor(mesh[6])
        : detail.slug === 'population-land-price' || !included
          ? '#cbd5e1'
          : detail.slug === 'population-flood-risk'
            ? '#b91c1c'
            : '#0f766e';
    const group = paths.get(color) ?? [];
    group.push(
      `M${left.toFixed(1)},${top.toFixed(1)}H${right.toFixed(1)}V${bottom.toFixed(1)}H${left.toFixed(1)}Z`
    );
    paths.set(color, group);
  }
  const points =
    singleLayer === 'population'
      ? []
      : detail.slug === 'population-land-price'
        ? detail.landPricePoints.map((point, index) => ({
            x: x(point[1]),
            y: y(point[2]),
            // Only highlight the question on the card; full categories live on the detail map.
            color:
              singleLayer === 'land-price'
                ? '#7c3aed'
                : landPointCategory(detail, index, byId).color === '#b91c1c'
                  ? '#b91c1c'
                  : '#64748b',
          }))
        : detail.slug === 'population-station-access'
          ? detail.stations.map((station) => ({
              x: x(station[2]),
              y: y(station[3]),
              color: '#f8fafc',
            }))
          : [];
  return {
    boundary: geography.rings
      .map(
        (ring) =>
          ring
            .map(
              (point, index) =>
                `${index === 0 ? 'M' : 'L'}${x(point[0] * 1e6).toFixed(1)},${y(point[1] * 1e6).toFixed(1)}`
            )
            .join('') + 'Z'
      )
      .join(''),
    landmarks: landmarks.map((landmark) => ({
      ...landmark,
      x: x(landmark.longitude),
      y: y(landmark.latitude),
    })),
    paths: [...paths].map(([color, segments]) => ({
      color,
      d: segments.join(''),
    })),
    points: points.filter(
      (point) =>
        point.x >= x(west * 1e6) &&
        point.x <= x(east * 1e6) &&
        point.y >= y(north * 1e6) &&
        point.y <= y(south * 1e6)
    ),
  };
}
