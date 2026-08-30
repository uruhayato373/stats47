import { describe, expect, it } from 'vitest';

import { buildGeoStationAccessMapModel } from '../build-geo-station-access-map-model';

import type { GeoStationAccessPrefDetail } from '@stats47/gis';

const detail: GeoStationAccessPrefDetail = {
  schemaVersion: 1,
  slug: 'population-station-access',
  generatedAt: '2026-08-30T00:00:00.000Z',
  areaCode: '13000',
  areaName: '東京都',
  accessRadiusMeters: 800,
  meshMethod: 'center-point',
  meshes: [
    ['533945', 139_700_000, 35_600_000, 139_710_000, 35_610_000, 100, 80, 1],
  ],
  stations: [['station-1', '東京', 139_705_000, 35_605_000]],
  summary: {
    meshCount: 1,
    accessibleMeshCount: 1,
    displayedStationCount: 1,
    population2020: 100,
    population2050: 80,
    accessiblePopulation2020: 100,
    accessiblePopulation2050: 80,
    stationAccessShare2020: 100,
    stationAccessShare2050: 100,
  },
};

describe('buildGeoStationAccessMapModel', () => {
  it('E6座標、人口変化率、駅アクセス判定をGeoJSONへ変換する', () => {
    const model = buildGeoStationAccessMapModel(detail);
    const feature = model.featureCollection.features[0];

    expect(feature?.geometry.coordinates[0]?.[0]).toEqual([139.7, 35.6]);
    expect(feature?.properties).toMatchObject({
      meshId: '533945',
      changeRate: -20,
      accessible: true,
    });
    expect(model.bounds).toEqual([
      [35.6, 139.7],
      [35.61, 139.71],
    ]);
  });

  it('重ね合わせ表示は駅圏メッシュだけで初期表示範囲を決める', () => {
    const withRemoteMesh: GeoStationAccessPrefDetail = {
      ...detail,
      meshes: [
        detail.meshes[0]!,
        ['remote', 150_000_000, 25_000_000, 150_010_000, 25_010_000, 5, 2, 0],
      ],
      summary: { ...detail.summary, meshCount: 2 },
    };
    const model = buildGeoStationAccessMapModel(withRemoteMesh, 'accessible');
    expect(model.featureCollection.features).toHaveLength(2);
    expect(model.bounds).toEqual([
      [35.6, 139.7],
      [35.61, 139.71],
    ]);
  });
});
