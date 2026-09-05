import { buildFloodPrefDetail, buildLandPricePrefDetail } from '@stats47/gis';
import { describe, expect, it } from 'vitest';

import {
  buildSpatialMeshMap,
  landPointCategory,
  spatialAuditRows,
} from '../geo-spatial-evidence';

const mesh = {
  meshId: 'mesh',
  areaCode: '13000',
  longitude: 139.005,
  latitude: 35.005,
  bounds: [139, 35, 139.01, 35.01] as const,
  population2020: 100,
  population2050: 80,
};
const input = {
  generatedAt: '2026-09-05',
  areaCode: '13000',
  areaName: '東京都',
  meshes: [mesh],
};

describe('地図の色と検算は県順位ではなく空間判定から決まる', () => {
  it('同じ地価上昇でも地点がメッシュの外なら灰色・比較対象外', () => {
    const detail = buildLandPricePrefDetail({
      ...input,
      points: [
        {
          id: 'in',
          areaCode: '13000',
          longitude: 139.005,
          latitude: 35.005,
          price: 10000,
          change: 1,
        },
        {
          id: 'out',
          areaCode: '13000',
          longitude: 140,
          latitude: 35.005,
          price: 10000,
          change: 1,
        },
        {
          id: 'new',
          areaCode: '13000',
          longitude: 139.005,
          latitude: 35.005,
          price: 10000,
          change: null,
        },
      ],
    });
    expect(landPointCategory(detail, 0).label).toBe('地価上昇 × 人口減少');
    expect(landPointCategory(detail, 1).label).toBe('人口メッシュ未接続');
    expect(landPointCategory(detail, 2).label).toBe('比較対象外');
    expect(spatialAuditRows(detail)[2].value).toBe('1 / 1地点 = 100%');
  });

  it('分母が0の場合は0%とせず算出不可とする', () => {
    const detail = buildLandPricePrefDetail({
      ...input,
      points: [
        {
          id: 'new',
          areaCode: '13000',
          longitude: 139.005,
          latitude: 35.005,
          price: 10000,
          change: null,
        },
      ],
    });
    expect(spatialAuditRows(detail)[2].value).toBe('0 / 0地点 = 算出不可');
  });

  it('浸水判定の内外を別に保ち、地図全体を県の集計率で塗らない', () => {
    const detail = buildFloodPrefDetail({
      ...input,
      meshes: [
        { ...mesh, floodDepthClass: 1 },
        {
          ...mesh,
          meshId: 'outside',
          bounds: [139.01, 35, 139.02, 35.01],
          floodDepthClass: 0,
        },
      ],
    });
    const features = buildSpatialMeshMap(detail).features;
    expect(features.map((f) => f.properties?.included)).toEqual([true, false]);
    expect(features[0]?.geometry.coordinates[0]?.[0]).toEqual([139, 35]);
    expect(spatialAuditRows(detail)[0].value).toBe('100人 + 100人 = 200人');
  });
});
