import { FLOOD_ARCHIVES, buildFloodPrefDetail } from '@stats47/gis';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';
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
import { loadGeoAnalysisPrefDetail } from '../load-geo-analysis-evidence';
import {
  parseGeoAnalysisSnapshot,
  loadGeoAnalysisSnapshot,
} from '../load-geo-analysis-snapshot';

function snapshot(): GeoAnalysisSnapshot {
  const rows = Array.from({ length: 47 }, (_, index) => ({
    areaCode: `${String(index + 1).padStart(2, '0')}000`,
    areaName: `県${index + 1}`,
    rank: index + 1,
    values: { risingDecliningPointShare: 47 - index },
  }));
  return {
    schemaVersion: 1,
    slug: 'population-land-price',
    generatedAt: '2026-08-29T00:00:00.000Z',
    dataVersion: '2020-2050',
    geography: 'prefecture',
    title: 'テスト分析',
    question: '何が違うか',
    primaryMetricKey: 'risingDecliningPointShare',
    metrics: [
      {
        key: 'risingDecliningPointShare',
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
  it('洪水の読込はmanifest欠落・新旧bundle混在を拒否する', async () => {
    const base = snapshot();
    const inputs = FLOOD_ARCHIVES.map(({ key }) => ({
      key,
      datasetId: 'A31b',
      layerId: 'flood',
      role: 'calculation-input',
      usedInCalculation: true,
    }));
    const manifest = {
      schemaVersion: 1,
      slug: 'population-flood-risk',
      generatedAt: base.generatedAt,
      definitionSha256: 'a'.repeat(64),
      inputs: [
        {
          layerId: 'population',
          role: 'calculation-input',
          usedInCalculation: true,
        },
        ...inputs,
      ],
      stages: [
        { kind: 'spatial-operation', inputIds: ['population', 'flood'] },
        { id: 'flood-maximum-polygons', outputs: inputs },
      ],
      aggregate: {},
      quality: { expectedAreas: 47, detailAreas: 47, conservationChecks: 47 },
    };
    const flood = {
      ...base,
      slug: 'population-flood-risk',
      dataQuality: {
        ...base.dataQuality,
        inputCounts: { floodZipFiles: FLOOD_ARCHIVES.length },
      },
    };
    const fetchMock = vi.mocked(fetchFromR2AsJson);
    for (const candidate of [
      null,
      { ...manifest, generatedAt: 'old' },
      { ...manifest, inputs: manifest.inputs.slice(1) },
    ]) {
      fetchMock.mockResolvedValueOnce(flood).mockResolvedValueOnce(candidate);
      expect(await loadGeoAnalysisSnapshot('population-flood-risk')).toBeNull();
    }
    fetchMock.mockResolvedValueOnce(flood).mockResolvedValueOnce(manifest);
    expect(await loadGeoAnalysisSnapshot('population-flood-risk')).toEqual(
      flood
    );
    const detail = buildFloodPrefDetail({
      generatedAt: base.generatedAt,
      areaCode: '13000',
      areaName: '東京都',
      meshes: [
        {
          meshId: '53394525',
          areaCode: '13000',
          longitude: 139.70625,
          latitude: 35.6041665,
          bounds: [139.7, 35.6, 139.7125, 35.608333],
          population2020: 100,
          population2050: 80,
          floodDepthClass: 2,
        },
      ],
    });
    fetchMock
      .mockResolvedValueOnce(detail)
      .mockResolvedValueOnce({ ...manifest, generatedAt: 'old' });
    expect(
      await loadGeoAnalysisPrefDetail('population-flood-risk', '13')
    ).toBeNull();
    fetchMock.mockResolvedValueOnce(detail).mockResolvedValueOnce(manifest);
    expect(
      await loadGeoAnalysisPrefDetail('population-flood-risk', '13')
    ).toEqual(detail);
  });
  it('比較・area・themeでも河川区分欠落の旧洪水snapshotを拒否する', () => {
    const base = snapshot();
    const flood = {
      ...base,
      slug: 'population-flood-risk',
      dataQuality: {
        ...base.dataQuality,
        inputCounts: { floodZipFiles: FLOOD_ARCHIVES.length },
      },
    };
    expect(
      parseGeoAnalysisSnapshot(flood, 'population-flood-risk')
    ).not.toBeNull();
    expect(
      parseGeoAnalysisSnapshot(
        {
          ...flood,
          dataQuality: {
            ...flood.dataQuality,
            inputCounts: { floodZipFiles: 94 },
          },
        },
        'population-flood-risk'
      )
    ).toBeNull();
  });
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
      parseGeoAnalysisSnapshot(
        { ...value, primaryMetricKey: 'medianResidentialLandPrice' },
        'population-land-price'
      )
    ).toBeNull();
    expect(parseGeoAnalysisSnapshot(value, 'population-flood-risk')).toBeNull();
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
