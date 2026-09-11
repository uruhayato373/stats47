import { expect, it } from 'vitest';

import { buildGeoSnowMapModel } from '../build-geo-snow-map-model';

import type { GeoSnowMesh } from '@stats47/gis';
it('自治体をまたぐ同一格子を保持し、2020人口と境界感度を表示する', () => {
  const model = buildGeoSnowMapModel({
    areaCode: '13000',
    meshes: [
      [5339452511, 13101, 12500, 1, 19],
      [5339452511, 13102, 25000, 2, 15],
    ],
  });
  expect(model.collection.features).toHaveLength(2);
  expect(new Set(model.collection.features.map((f) => f.id)).size).toBe(2);
  expect(
    model.collection.features.map((f) => f.properties?.population2020)
  ).toEqual([1.25, 2.5]);
  expect(
    model.collection.features.map((f) => f.properties?.boundaryCell)
  ).toEqual([true, false]);
  expect(model.collection.features[1]?.properties?.centerClass).toBe(2);
});
it('5万格子を超える県の末尾を切り捨てない', () => {
  const meshes = Array.from({ length: 74073 }, (_, i): GeoSnowMesh => [
    5339452511,
    13101,
    i + 1,
    0,
    0,
  ]);
  const model = buildGeoSnowMapModel({
    areaCode: '13000',
    meshes,
  });
  expect(model.collection.features).toHaveLength(74073);
  expect(model.collection.features.at(-1)?.properties?.population2020).toBe(
    7.4073
  );
});
