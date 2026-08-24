import { describe, expect, it } from 'vitest';

import { buildMunicipalityRankingSnapshots } from '../build-municipality-snapshots';
import {
  municipalityRankingItemKeyPath,
  municipalityRankingValuesKeyPath,
} from '../../types/municipality-snapshot';
import { rankingItemKeyPath, rankingValuesKeyPath } from '../../types/snapshot';

import type { MunicipalityEntityPolicy } from '@stats47/area';

const policy: MunicipalityEntityPolicy = {
  key: 'test-policy',
  entities: [
    {
      code: '01100',
      name: '北海道 札幌市',
      prefectureCode: '01000',
      disposition: 'publishable',
      kind: 'city',
    },
    {
      code: '01202',
      name: '北海道 函館市',
      prefectureCode: '01000',
      disposition: 'publishable',
      kind: 'city',
    },
    {
      code: '01303',
      name: '北海道 当別町',
      prefectureCode: '01000',
      disposition: 'publishable',
      kind: 'town',
    },
    {
      code: '01101',
      name: '北海道 札幌市 中央区',
      prefectureCode: '01000',
      disposition: 'excluded',
      kind: 'administrative-ward',
      reason: 'fixture',
      parentMunicipalityCode: '01100',
    },
  ],
};

const metric = {
  key: 'metric',
  title: 'テスト指標',
  unit: '％',
  source: { displayName: 'テスト調査', url: 'https://example.com' },
};

describe('buildMunicipalityRankingSnapshots', () => {
  it('都道府県snapshotとは別のR2名前空間を使う', () => {
    expect(municipalityRankingItemKeyPath('metric')).toBe(
      'app/municipalities/ranking/metric/item.json'
    );
    expect(municipalityRankingValuesKeyPath('metric')).toBe(
      'app/municipalities/ranking/metric/values.json'
    );
    expect(municipalityRankingItemKeyPath('metric')).not.toBe(
      rankingItemKeyPath('metric')
    );
    expect(municipalityRankingValuesKeyPath('metric')).not.toBe(
      rankingValuesKeyPath('metric', 'prefecture')
    );
  });

  it('最新年だけを順位化し、行政区と欠測を順位へ入れない', () => {
    const result = buildMunicipalityRankingSnapshots({
      metric,
      entityPolicy: policy,
      generatedAt: '2026-08-24T00:00:00.000Z',
      rows: [
        { areaCode: '01100', areaName: '札幌市', yearCode: '2019', value: 10 },
        { areaCode: '01100', areaName: '札幌市', yearCode: '2020', value: 30 },
        { areaCode: '01202', areaName: '函館市', yearCode: '2020', value: 30 },
        {
          areaCode: '01303',
          areaName: '当別町',
          yearCode: '2020',
          value: null,
        },
        { areaCode: '01101', areaName: '中央区', yearCode: '2020', value: 99 },
      ],
    });

    expect(result.item).toMatchObject({
      entityCount: 3,
      valueCount: 2,
      excludedEntityCount: 1,
      latestYear: { yearCode: '2020' },
    });
    expect(result.values.values).toEqual([
      expect.objectContaining({ areaCode: '01100', rank: 1, value: 30 }),
      expect.objectContaining({ areaCode: '01202', rank: 1, value: 30 }),
    ]);
  });

  it('最新年の自治体コード重複を拒否する', () => {
    expect(() =>
      buildMunicipalityRankingSnapshots({
        metric,
        entityPolicy: policy,
        generatedAt: '2026-08-24T00:00:00.000Z',
        rows: [
          { areaCode: '01100', areaName: '札幌市', yearCode: '2020', value: 1 },
          { areaCode: '01100', areaName: '札幌市', yearCode: '2020', value: 2 },
        ],
      })
    ).toThrow(/duplicate municipality observation/);
  });

  it('指標固有の値範囲から外れる観測値を欠測相当として順位から除外する', () => {
    const result = buildMunicipalityRankingSnapshots({
      metric: { ...metric, valuePolicy: { minExclusive: 0, maxInclusive: 100 } },
      entityPolicy: policy,
      generatedAt: '2026-08-24T00:00:00.000Z',
      rows: [
        { areaCode: '01100', areaName: '札幌市', yearCode: '2020', value: 0 },
        { areaCode: '01202', areaName: '函館市', yearCode: '2020', value: 20 },
        { areaCode: '01303', areaName: '当別町', yearCode: '2020', value: 101 },
      ],
    });

    expect(result.item).toMatchObject({ entityCount: 3, valueCount: 1 });
    expect(result.values.values).toEqual([
      expect.objectContaining({ areaCode: '01202', value: 20, rank: 1 }),
    ]);
  });
});
