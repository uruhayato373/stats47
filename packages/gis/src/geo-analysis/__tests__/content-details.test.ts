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
          matchedPointCount: 1,
          unmatchedPointCount: 1,
          comparablePointCount: 1,
          risingDecliningPointCount: 1,
          risingDecliningPointShare: 100,
          sampleCount: 2,
          medianResidentialLandPrice: 200,
          medianLandPriceChange: 2,
          population2050: 120,
          populationChangeRate: -20,
        })
      )
    ).not.toThrow();
  });

  it('同じ県・同じ価格でも地点を動かすと空間判定が変わる。境界・欠測は分母を増やさない', () => {
    const input = {
      generatedAt: '2026-09-05T00:00:00Z', areaCode: '13000', areaName: '東京都',
      meshes: [meshes[0]!, { ...meshes[1]!, population2050: 70 }],
      points: [
        { id: 'a', areaCode: '13000', longitude: 139.71, latitude: 35.601, price: 100, change: 1 },
        { id: 'b', areaCode: '13000', longitude: 139.7125, latitude: 35.601, price: 100, change: 1 },
        { id: 'c', areaCode: '13000', longitude: 139.71, latitude: 35.601, price: 100, change: null },
        { id: 'd', areaCode: '13000', longitude: 139.8, latitude: 35.7, price: 100, change: 1 },
      ],
    };
    const detail = buildLandPricePrefDetail(input);
    expect(detail.pointMeshIds).toEqual(['53394525', '53394526', '53394525', null]);
    expect(detail.summary).toMatchObject({ matchedPointCount: 3, unmatchedPointCount: 1, comparablePointCount: 2, risingDecliningPointCount: 1, risingDecliningPointShare: 50 });
    const moved = buildLandPricePrefDetail({ ...input, points: input.points.map(point => ({ ...point, longitude: 139.72 })) });
    expect(moved.summary.risingDecliningPointShare).toBe(0);
    expect(input.points[0]?.longitude).toBe(139.71);
    expect(() => assertLandPriceConservation({ ...detail, pointMeshIds: [null, ...detail.pointMeshIds.slice(1)] }, row({}))).toThrow(/空間結合不一致/);
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
