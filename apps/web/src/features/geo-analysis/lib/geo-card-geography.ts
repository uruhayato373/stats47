import { readPrefectureFeatures } from '@stats47/visualization/server';

import { GEO_DEFAULT_PREF_CODE } from './geo-default-prefecture';

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

/** Every polygon of the prefecture (mainland and islands such as 淡路島) from the
 * existing NII/KSJ boundary asset. Nothing is cropped, so the viewport covers the
 * whole prefecture; remote-island prefectures would need their own crop rule.
 */
export function getPrefectureCardGeography(
  prefCode = GEO_DEFAULT_PREF_CODE
): GeoCardGeography {
  const prefecture = readPrefectureFeatures().find(
    (f) => f.properties?.N03_007 === prefCode
  );
  if (
    !prefecture ||
    (prefecture.geometry.type !== 'MultiPolygon' &&
      prefecture.geometry.type !== 'Polygon')
  ) {
    throw new Error(
      `Prefecture ${prefCode} boundary is missing from the prefecture topology`
    );
  }
  const polygons =
    prefecture.geometry.type === 'MultiPolygon'
      ? prefecture.geometry.coordinates
      : [prefecture.geometry.coordinates];
  const rings = polygons.flat();
  return { rings, bounds: boundsOf(rings) };
}

/** Names and representative positions come from the same verified station bundle
 * (兵庫県: 神戸・姫路 on the south coast, 豊岡 in the north). */
export function geoCardLandmarks(detail: GeoStationAccessPrefDetail) {
  return ['豊岡', '姫路', '神戸'].flatMap((name) => {
    const station = detail.stations.find((s) => s[1] === name);
    return station
      ? [
          {
            name: `${name}駅`,
            longitude: station[2],
            latitude: station[3],
            // 姫路 is labelled below so neither label covers 淡路島.
            below: name === '姫路',
          },
        ]
      : [];
  });
}
