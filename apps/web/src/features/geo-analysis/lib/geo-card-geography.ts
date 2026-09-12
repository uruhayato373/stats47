import { readPrefectureFeatures } from '@stats47/visualization/server';

import type { GeoStationAccessPrefDetail } from '@stats47/gis';
import type { Position } from 'geojson';

export interface GeoCardGeography {
  rings: Position[][];
  bounds: readonly [number, number, number, number];
}

function boundsOf(rings: Position[][]): [number, number, number, number] {
  const points = rings.flat();
  return [
    Math.min(...points.map((p) => p[0])),
    Math.min(...points.map((p) => p[1])),
    Math.max(...points.map((p) => p[0])),
    Math.max(...points.map((p) => p[1])),
  ];
}

/** The largest Tokyo landmass defines the mainland; nearby reclaimed islands
 * within its envelope remain visible. Izu/Ogasawara are outside this viewport.
 * Reuse the existing NII/KSJ boundary asset without a new data copy or tile fetch.
 */
export function getTokyoMainlandGeography(): GeoCardGeography {
  const tokyo = readPrefectureFeatures().find(
    (f) => f.properties?.N03_007 === '13'
  );
  if (
    !tokyo ||
    (tokyo.geometry.type !== 'MultiPolygon' &&
      tokyo.geometry.type !== 'Polygon')
  ) {
    throw new Error('Tokyo boundary is missing from the prefecture topology');
  }
  const polygons =
    tokyo.geometry.type === 'MultiPolygon'
      ? tokyo.geometry.coordinates
      : [tokyo.geometry.coordinates];
  const area = (ring: Position[]) =>
    Math.abs(
      ring.reduce((sum, p, i) => {
        const next = ring[(i + 1) % ring.length];
        return sum + p[0] * next[1] - next[0] * p[1];
      }, 0)
    );
  const largest = polygons.reduce((best, polygon) =>
    area(polygon[0]) > area(best[0]) ? polygon : best
  );
  const [west, south, east, north] = boundsOf(largest);
  const rings = polygons
    .filter((polygon) =>
      polygon[0].some(
        (p) => p[0] >= west && p[0] <= east && p[1] >= south && p[1] <= north
      )
    )
    .flat();
  return { rings, bounds: boundsOf(rings) };
}

/** Names and representative positions come from the same verified station bundle. */
export function geoCardLandmarks(detail: GeoStationAccessPrefDetail) {
  return ['奥多摩', '八王子', '新宿'].flatMap((name) => {
    const station = detail.stations.find((s) => s[1] === name);
    return station
      ? [
          {
            name: `${name}駅`,
            longitude: station[2],
            latitude: station[3],
            below: name === '八王子',
          },
        ]
      : [];
  });
}
