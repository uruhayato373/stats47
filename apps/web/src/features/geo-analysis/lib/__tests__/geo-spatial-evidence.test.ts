// @vitest-environment node
import {
  buildFloodPrefDetail,
  buildLandPricePrefDetail,
  type GeoAnalysisPrefDetail,
} from '@stats47/gis';
import { describe, expect, it } from 'vitest';

import {
  buildSpatialMeshMap,
  landPointCategory,
  spatialAuditRows,
} from '../geo-spatial-evidence';

import { lowElevationDetailFixture } from './geo-low-elevation-fixture';
import { publicFacilityDetailFixture } from './geo-public-facility-fixture';

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
    expect(spatialAuditRows(detail)[2]).toMatchObject({ value: '100%', meta: '1 / 1地点' });
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
    expect(spatialAuditRows(detail)[2]).toMatchObject({ value: '算出不可', meta: '0 / 0地点' });
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
    expect(spatialAuditRows(detail)[0]).toMatchObject({ value: '200人', meta: '100人 + 100人' });
  });
});

/**
 * 守る意図: 検算の行は数値タイル (値 24px) に出る。式を丸ごと値に入れると 1 枚が 5〜7 行になって読めないので、
 * 式の結果 (合計・比率・一致の判定) だけを値にし、内訳の式は補足 (meta・12px) に分ける (UI-FOLLOWUP-01)。
 */
describe('検算の行は結果を値に、内訳の式を補足に分ける', () => {
  const FORMULA = / [=+] /;

  it('浸水・地価: 値に式を残さず、補足が内訳の式になる', () => {
    const flood = spatialAuditRows(
      buildFloodPrefDetail({ ...input, meshes: [{ ...mesh, floodDepthClass: 1 }] })
    );
    const land = spatialAuditRows(
      buildLandPricePrefDetail({
        ...input,
        points: [{ id: 'in', areaCode: '13000', longitude: 139.005, latitude: 35.005, price: 10000, change: 1 }],
      })
    );
    for (const row of [...flood, ...land]) expect(row.value, row.label).not.toMatch(FORMULA);
    expect(flood[1]).toMatchObject({ value: '80人', meta: '80人 + 0人' });
    expect(land[0]).toMatchObject({ value: '1地点', meta: '1 + 0' });
  });

  it('低標高: 合計・一致の判定・比率を値にし、基準高ごとの割合は 1 行ずつに分ける', () => {
    const detail = lowElevationDetailFixture('13') as unknown as Extract<
      GeoAnalysisPrefDetail,
      { slug: 'population-low-elevation' }
    >;
    const rows = spatialAuditRows(detail);
    const people = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}人`;
    for (const row of rows) expect(row.value, row.label).not.toMatch(FORMULA);
    expect(rows[0]).toMatchObject({
      value: people(detail.summary.population2020),
      meta: detail.summary.bands.map((band) => people(band.population)).join(' + '),
    });
    expect(rows[1]!.value).toBe(detail.summary.conservation.matchesCensus ? '一致' : '不一致');
    expect(rows[1]!.meta).toBe(
      `${people(detail.summary.conservation.meshPopulation)} / ${people(detail.summary.conservation.censusPopulation2020)}`
    );
    expect(rows[2]!.value).toMatch(/^\d+\.\d%$/);
    // 基準高 (0m・5m・10m) ごとに 1 行。1 枚に 3 組を並べると値が 3 行になる
    const shareRows = rows.slice(3);
    expect(shareRows).toHaveLength(detail.summary.thresholds.length);
    for (const [index, row] of shareRows.entries()) {
      expect(row.label).toContain(`${detail.summary.thresholds[index]!.thresholdM}m以下`);
      expect(row.value).toMatch(/^[\d.]+% \/ [\d.]+%$/);
    }
  });

  it('公共施設: 入力人口を値に、5帯の合計を補足にする', () => {
    const rows = spatialAuditRows(publicFacilityDetailFixture('13'));
    for (const row of rows) expect(row.value, row.label).not.toMatch(FORMULA);
    expect(rows[0]!.value).toMatch(/^[\d,]+人$/);
    expect(rows[0]!.meta).toMatch(/^5帯の合計 [\d,]+人$/);
  });

  it('豪雪: 基準人口と面積の合計を値にし、中心包含の人口に全格子包含と一部交差の幅を補足で添える', () => {
    const rows = spatialAuditRows({
      slug: 'population-snow-designation',
      summary: {
        populationScaled: [10_000, 20_000, 30_005],
        populationTotalScaled: 60_005,
        lowerScaled: [40_000, 30_000],
        upperScaled: [60_005, 30_005],
        boundaryScaled: [20_005, 5],
        regularOnlyAreaKm2: 1.5,
        specialAreaKm2: 2.25,
        designatedAreaKm2: 3.75,
      },
    } as unknown as GeoAnalysisPrefDetail);
    for (const row of rows) expect(row.value, row.label).not.toMatch(FORMULA);
    expect(rows[0]).toMatchObject({ value: '6.0005人', meta: '1人 + 2人 + 3.0005人' });
    expect(rows[1]).toMatchObject({ value: '5.0005人', meta: '全格子包含 4人 〜 一部交差 6.0005人' });
    expect(rows[1]!.label).toContain('中心包含');
    expect(rows[3]).toMatchObject({ value: '3.750 km²', meta: '1.500 + 2.250' });
  });
});
