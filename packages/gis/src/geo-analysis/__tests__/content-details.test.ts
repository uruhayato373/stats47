import { describe, expect, it } from 'vitest';

import {
  assertFloodConservation,
  assertLandPriceConservation,
  buildFloodPrefDetail,
  buildLandPricePrefDetail,
} from '../content-details';

import type { PopulationMeshPoint } from '../geo-analysis-core';
import type { GeoAnalysisSnapshotRow } from '../snapshot';

const meshes: PopulationMeshPoint[] = [
  {
    meshId: '53394525',
    areaCode: '13000',
    longitude: 139.7,
    latitude: 35.6,
    bounds: [139.7, 35.6, 139.7125, 35.608333],
    population2020: 100,
    population2050: 80,
    floodDepthClass: 2,
  },
  {
    meshId: '53394526',
    areaCode: '13000',
    longitude: 139.71,
    latitude: 35.6,
    bounds: [139.7125, 35.6, 139.725, 35.608333],
    population2020: 50,
    population2050: 40,
  },
];

function row(values: Record<string, number>): GeoAnalysisSnapshotRow {
  return { areaCode: '13000', areaName: '東京都', rank: 1, values };
}

describe('Geo記事制作用の県別artifact', () => {
  it('地価地点・人口メッシュとaggregateの保存則を固定する', () => {
    const detail = buildLandPricePrefDetail({
      generatedAt: '2026-08-31T00:00:00.000Z',
      areaCode: '13000',
      areaName: '東京都',
      meshes,
      points: [
        { id: 'a', areaCode: '13000', longitude: 139.7, latitude: 35.6, price: 100, change: 1 },
        { id: 'b', areaCode: '13000', longitude: 139.8, latitude: 35.7, price: 300, change: 3 },
      ],
    });
    expect(detail.summary).toMatchObject({
      meshCount: 2,
      pointCount: 2,
      population2050: 120,
      medianResidentialLandPrice: 200,
      medianLandPriceChange: 2,
      populationChangeRate: -20,
    });
    expect(() =>
      assertLandPriceConservation(
        detail,
        row({
          sampleCount: 2,
          medianResidentialLandPrice: 200,
          medianLandPriceChange: 2,
          population2050: 120,
          populationChangeRate: -20,
        })
      )
    ).not.toThrow();
  });

  it('洪水包含結果・人口とaggregateの保存則を固定する', () => {
    const detail = buildFloodPrefDetail({
      generatedAt: '2026-08-31T00:00:00.000Z',
      areaCode: '13000',
      areaName: '東京都',
      meshes,
    });
    expect(detail.summary).toMatchObject({
      meshCount: 2,
      exposedMeshCount: 1,
      exposedPopulation2050: 80,
      floodExposureShare2020: 66.7,
      floodExposureShare2050: 66.7,
    });
    expect(() =>
      assertFloodConservation(
        detail,
        row({
          exposedMeshCount: 1,
          exposedPopulation2050: 80,
          floodExposureShare2020: 66.7,
          floodExposureShare2050: 66.7,
        })
      )
    ).not.toThrow();
  });

  it('aggregateが途中artifactと違えば公開を止める', () => {
    const detail = buildFloodPrefDetail({
      generatedAt: '2026-08-31T00:00:00.000Z',
      areaCode: '13000',
      areaName: '東京都',
      meshes,
    });
    expect(() =>
      assertFloodConservation(
        detail,
        row({
          exposedMeshCount: 2,
          exposedPopulation2050: 80,
          floodExposureShare2020: 66.7,
          floodExposureShare2050: 66.7,
        })
      )
    ).toThrow(/conservation不一致/);
  });
});
