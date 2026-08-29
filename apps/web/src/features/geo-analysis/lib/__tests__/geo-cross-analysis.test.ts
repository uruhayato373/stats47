import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@stats47/r2-storage/server', () => ({
  fetchFromR2AsJson: vi.fn(),
}));

import {
  buildGeoMapModel,
  formatGeoValue,
  type GeoAnalysisSnapshot,
} from '../geo-cross-analysis';
import { parseGeoAnalysisSnapshot } from '../load-geo-analysis-snapshot';

function snapshot(): GeoAnalysisSnapshot {
  const rows = Array.from({ length: 47 }, (_, index) => ({
    areaCode: `${String(index + 1).padStart(2, '0')}000`,
    areaName: `県${index + 1}`,
    rank: index + 1,
    values: { testValue: 47 - index },
  }));
  return {
    schemaVersion: 1,
    slug: 'population-land-price',
    generatedAt: '2026-08-29T00:00:00.000Z',
    dataVersion: '2020-2050',
    geography: 'prefecture',
    title: 'テスト分析',
    question: '何が違うか',
    primaryMetricKey: 'testValue',
    metrics: [
      {
        key: 'testValue',
        label: 'テスト値',
        unit: '%',
        format: 'percent1',
        description: 'テスト用',
      },
    ],
    rows,
    summary: {
      observationCount: 47,
      medianValue: 24,
      topAreaCodes: rows.slice(0, 5).map((row) => row.areaCode),
      bottomAreaCodes: rows.slice(-5).map((row) => row.areaCode),
    },
    method: ['同じ方法で集計'],
    sources: [
      {
        name: '一次資料',
        url: 'https://example.com/source',
        datasetId: 'TEST',
        version: '1',
        license: 'CC BY 4.0',
      },
    ],
    caveats: ['推計'],
    dataQuality: {
      expectedAreas: 47,
      actualAreas: 47,
      missingAreaCodes: [],
      inputCounts: { records: 47 },
      coverageNote: '47県確認',
    },
  };
}

describe('Geo cross analysis', () => {
  it('47都道府県・metric・coverageを満たすsnapshotだけを受理する', () => {
    const value = snapshot();
    expect(parseGeoAnalysisSnapshot(value, 'population-land-price')).toEqual(
      value
    );
    expect(
      parseGeoAnalysisSnapshot(
        { ...value, rows: value.rows.slice(0, 46) },
        'population-land-price'
      )
    ).toBeNull();
    expect(
      parseGeoAnalysisSnapshot(value, 'population-flood-risk')
    ).toBeNull();
  });

  it('snapshotから地図用ranking modelを決定的に生成する', () => {
    const model = buildGeoMapModel(snapshot());
    expect(model.rankingItem).toMatchObject({
      areaType: 'prefecture',
      title: 'テスト値',
      unit: '%',
    });
    expect(model.rankingValues).toHaveLength(47);
    expect(model.rankingValues[0]).toMatchObject({
      areaCode: '01000',
      value: 47,
      rank: 1,
    });
  });

  it('整数・小数・符号付き率を日本語表示へ整形する', () => {
    expect(formatGeoValue({ format: 'integer', unit: '人' }, 1234)).toBe(
      '1,234人'
    );
    expect(formatGeoValue({ format: 'signedPercent1', unit: '%' }, 2.5)).toBe(
      '+2.5%'
    );
    expect(formatGeoValue({ format: 'percent1', unit: '%' }, null)).toBe('—');
  });
});
