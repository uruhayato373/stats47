import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  PUBLIC_FACILITY_BANDS,
  createPublicFacilitySearch,
  publicFacilityDistanceBand,
  summarizePublicFacilityMeshes,
  publicFacilityAggregateValues,
  validatePublicFacilityDetail,
  assertPublicFacilityConservation,
} from '../public-facility-access';
import type {
  GeoPublicFacilityPrefDetail,
  GeoPublicFacilityPoint,
} from '../snapshot';
const points: GeoPublicFacilityPoint[] = [
  [0, 'P05-22:37:0', '37201', '1', '市役所', 133.60725, 34.0375],
  [1, 'P05-22:38:0', '38213', '2', '県外支所', 133.60625, 34.0375],
  [2, 'P05-22:37:1', '37201', '4', '公民館', 133.60625, 34.0385],
];
function fixture(): GeoPublicFacilityPrefDetail {
  const search = createPublicFacilitySearch(points),
    a = search(133.60625, 34.0375, 'administrative'),
    b = search(133.60625, 34.0375, 'meeting');
  const meshes = [
    [
      '51330448',
      133.60625,
      34.0375,
      100,
      80,
      a.point[0],
      a.distanceMeters,
      a.bandIndex,
      b.point[0],
      b.distanceMeters,
      b.bandIndex,
    ],
  ] as const;
  return {
    schemaVersion: 1,
    slug: 'population-public-facility-access',
    generatedAt: '2026-09-10T00:00:00Z',
    areaCode: '37000',
    areaName: '香川県',
    bands: PUBLIC_FACILITY_BANDS,
    facilities: points,
    meshes,
    summary: summarizePublicFacilityMeshes(meshes, points, '37000'),
  };
}
describe('public facility distance population', () => {
  it('searches across prefecture borders and preserves independent population totals', () => {
    const before = JSON.stringify(points),
      d = fixture();
    validatePublicFacilityDetail(d);
    assert.equal(d.meshes[0][5], 1);
    assert.equal(d.meshes[0][6], 0);
    assert.equal(d.summary.administrative[0].crossPrefNearest, 1);
    const v = publicFacilityAggregateValues(d);
    assert.equal(v.population2020, 100);
    assert.equal(v.administrativeBand0Population2020, 100);
    assert.equal(v.meetingBand0Population2020, 100);
    assert.equal(v.administrativeWithin1000mShare2050, 100);
    assert.equal(v.administrativeFacilityCount, 1);
    assert.equal(JSON.stringify(points), before);
  });
  it('treats each upper distance boundary as inclusive and rejects invalid distances', () => {
    for (const [i, m] of [500, 1000, 3000, 5000].entries()) {
      assert.equal(publicFacilityDistanceBand(m), i);
      assert.equal(publicFacilityDistanceBand(m + 0.001), i + 1);
    }
    assert.equal(publicFacilityDistanceBand(0), 0);
    for (const n of [-1, NaN, Infinity])
      assert.throws(() => publicFacilityDistanceBand(n));
  });
  it('breaks exact distance ties by stable source ID without changing source order', () => {
    const duplicate: GeoPublicFacilityPoint = [
      3,
      'P05-22:38:10',
      '38213',
      '2',
      '同一点の支所',
      133.60625,
      34.0375,
    ];
    assert.equal(
      createPublicFacilitySearch([...points, duplicate])(
        133.60625,
        34.0375,
        'administrative'
      ).point[1],
      'P05-22:38:0'
    );
  });
  it('rejects missing source points, incorrect distances, bands, populations and grid locations', () => {
    const mutations = [
      (d: any) => d.facilities.splice(1, 1),
      (d: any) => (d.meshes[0][6] = 20),
      (d: any) => (d.meshes[0][7] = 1),
      (d: any) => (d.meshes[0][3] = null),
      (d: any) => (d.meshes[0][1] += 0.001),
      (d: any) => d.meshes.push([...d.meshes[0]]),
      (d: any) => (d.summary.administrative[0].population2020 = 101),
      (d: any) => (d.summary.meeting[0].meshCount = 0),
      (d: any) => (d.bands[0].maxMeters = 600),
      (d: any) => (d.facilities[0][1] = 'P05-10:37:0'),
      (d: any) => (d.slug = 'population-station-access'),
    ];
    for (const mutate of mutations) {
      const d = structuredClone(fixture());
      mutate(d);
      assert.throws(() => validatePublicFacilityDetail(d));
    }
    assert.throws(() =>
      assertPublicFacilityConservation(fixture(), {
        areaCode: '37000',
        areaName: '香川県',
        rank: 1,
        values: {
          ...publicFacilityAggregateValues(fixture()),
          population2050: 81,
        },
      })
    );
  });
});
