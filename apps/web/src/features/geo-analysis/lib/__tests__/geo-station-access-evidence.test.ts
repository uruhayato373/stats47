import { describe, expect, test } from 'vitest';

import { parseGeoStationAccessPrefDetail } from '../geo-station-access-evidence';

const validDetail = {
  schemaVersion: 1,
  slug: 'population-station-access',
  generatedAt: '2026-08-30T00:00:00.000Z',
  areaCode: '13000',
  areaName: '東京都',
  accessRadiusMeters: 800,
  meshMethod: 'center-point',
  meshes: [
    ['a', 139_000_000, 35_000_000, 139_010_000, 35_010_000, 100, 80, 1],
    ['b', 139_010_000, 35_000_000, 139_020_000, 35_010_000, 100, 60, 0],
  ],
  stations: [['s', '駅', 139_005_000, 35_005_000]],
  summary: {
    meshCount: 2,
    accessibleMeshCount: 1,
    displayedStationCount: 1,
    population2020: 200,
    population2050: 140,
    accessiblePopulation2020: 100,
    accessiblePopulation2050: 80,
    stationAccessShare2020: 50,
    stationAccessShare2050: 57.1,
  },
};

describe('geo station access evidence parser', () => {
  test('保存則を満たす県別artifactだけを受理する', () => {
    expect(parseGeoStationAccessPrefDetail(validDetail, '13')).not.toBeNull();
    expect(
      parseGeoStationAccessPrefDetail(
        {
          ...validDetail,
          summary: { ...validDetail.summary, accessibleMeshCount: 2 },
        },
        '13'
      )
    ).toBeNull();
  });

  test('県コード不一致・重複mesh・不正座標をfail-closedにする', () => {
    expect(parseGeoStationAccessPrefDetail(validDetail, '27')).toBeNull();
    expect(
      parseGeoStationAccessPrefDetail(
        { ...validDetail, meshes: [validDetail.meshes[0], validDetail.meshes[0]] },
        '13'
      )
    ).toBeNull();
    expect(
      parseGeoStationAccessPrefDetail(
        {
          ...validDetail,
          stations: [['s', '駅', 999_000_000, 35_005_000]],
        },
        '13'
      )
    ).toBeNull();
  });
});
