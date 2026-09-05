import { FLOOD_ARCHIVES, buildFloodPrefDetail } from '@stats47/gis';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@stats47/r2-storage/server', () => ({
  fetchFromR2AsJson: vi.fn(),
}));

import {
  buildGeoMapModel,
  GEO_CROSS_ANALYSIS_SLUGS,
  formatGeoValue,
  type GeoAnalysisSnapshot,
  type GeoCrossAnalysisSlug,
} from '../geo-cross-analysis';
import { loadGeoAnalysisPrefDetail } from '../load-geo-analysis-evidence';
import {
  parseGeoAnalysisSnapshot,
  loadGeoAnalysisSnapshot,
  loadGeoAnalysisBundle,
} from '../load-geo-analysis-snapshot';

import { bindFixtureArtifact, manifestFixture } from './geo-manifest-fixture';

function snapshot(
  slug: GeoCrossAnalysisSlug = 'population-land-price'
): GeoAnalysisSnapshot {
  const primaryMetricKey = {
    'population-land-price': 'risingDecliningPointShare',
    'population-flood-risk': 'floodExposureShare2050',
    'population-station-access': 'stationAccessShare2050',
  }[slug];
  const rows = Array.from({ length: 47 }, (_, index) => ({
    areaCode: `${String(index + 1).padStart(2, '0')}000`,
    areaName: `県${index + 1}`,
    rank: index + 1,
    values: { [primaryMetricKey]: 47 - index },
  }));
  return {
    schemaVersion: 1,
    slug,
    generatedAt: '2026-08-29T00:00:00.000Z',
    dataVersion: '2020-2050',
    geography: 'prefecture',
    title: 'テスト分析',
    question: '何が違うか',
    primaryMetricKey,
    metrics: [
      {
        key: primaryMetricKey,
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
  for (const slug of GEO_CROSS_ANALYSIS_SLUGS) {
    it(`${slug}: 表示するmanifestはsnapshotを検証した一組だけ（A/B切替で二重読込しない）`, async () => {
      const base = snapshot(slug);
      const value = {
        ...base,
        dataQuality: {
          ...base.dataQuality,
          inputCounts: { floodZipFiles: FLOOD_ARCHIVES.length },
        },
      };
      const manifest = bindFixtureArtifact(
        { ...manifestFixture(slug), generatedAt: value.generatedAt },
        `app/geo/${slug}/item.json`,
        value,
        true
      );
      const fetchMock = vi.mocked(fetchFromR2AsJson);
      fetchMock.mockReset();
      fetchMock
        .mockResolvedValueOnce(value)
        .mockResolvedValueOnce(manifest)
        .mockResolvedValueOnce({
          ...manifest,
          generatedAt: '2026-09-06T00:00:00Z',
        });
      expect(await loadGeoAnalysisBundle(slug)).toEqual({
        snapshot: value,
        manifest,
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      fetchMock.mockReset();
      fetchMock
        .mockResolvedValueOnce(value)
        .mockResolvedValueOnce({
          ...manifest,
          generatedAt: '2026-09-06T00:00:00Z',
        });
      expect(await loadGeoAnalysisBundle(slug)).toBeNull();
      fetchMock.mockReset();
    });
    it(`${slug}: 集計のmanifest必須・版混在・SHA改変を共通拒否する`, async () => {
      const base = snapshot(slug);
      const value = {
        ...base,
        slug,
        dataQuality: {
          ...base.dataQuality,
          inputCounts: { floodZipFiles: FLOOD_ARCHIVES.length },
        },
      };
      const manifest = bindFixtureArtifact(
        { ...manifestFixture(slug), generatedAt: value.generatedAt },
        `app/geo/${slug}/item.json`,
        value,
        true
      );
      const fetchMock = vi.mocked(fetchFromR2AsJson);
      for (const candidate of [
        null,
        { ...manifest, generatedAt: '2026-09-04T00:00:00Z' },
        { ...manifest, definitionSha256: 'invalid' },
      ]) {
        fetchMock.mockResolvedValueOnce(value).mockResolvedValueOnce(candidate);
        expect(await loadGeoAnalysisSnapshot(slug)).toBeNull();
      }
      fetchMock
        .mockResolvedValueOnce({ ...value, title: '別の内容' })
        .mockResolvedValueOnce(manifest);
      expect(await loadGeoAnalysisSnapshot(slug)).toBeNull();
      fetchMock.mockResolvedValueOnce(value).mockResolvedValueOnce(manifest);
      expect(await loadGeoAnalysisSnapshot(slug)).toEqual(value);
    });
  }
  it('metric重複・順位非finite・summary不正・method不正を拒否する', () => {
    const value = snapshot();
    for (const patch of [
      { metrics: [...value.metrics, value.metrics[0]] },
      {
        rows: value.rows.map((row, i) =>
          i ? row : { ...row, rank: Infinity }
        ),
      },
      {
        rows: value.rows.map((row, i) =>
          i ? row : { ...row, values: { risingDecliningPointShare: NaN } }
        ),
      },
      { summary: { ...value.summary, medianValue: Infinity } },
      { summary: { ...value.summary, topAreaCodes: ['48000'] } },
      { method: [42] },
      { dataQuality: { ...value.dataQuality, inputCounts: { records: NaN } } },
    ])
      expect(
        parseGeoAnalysisSnapshot(
          { ...value, ...patch },
          'population-land-price'
        )
      ).toBeNull();
  });
  it('洪水の読込はmanifest欠落・新旧bundle混在を拒否する', async () => {
    const base = snapshot('population-flood-risk');
    const flood = {
      ...base,
      slug: 'population-flood-risk',
      dataQuality: {
        ...base.dataQuality,
        inputCounts: { floodZipFiles: FLOOD_ARCHIVES.length },
      },
    };
    const fetchMock = vi.mocked(fetchFromR2AsJson);
    const manifest = bindFixtureArtifact(
      {
        ...manifestFixture('population-flood-risk'),
        generatedAt: base.generatedAt,
      },
      'app/geo/population-flood-risk/item.json',
      flood,
      true
    );
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
    fetchMock
      .mockResolvedValueOnce(detail)
      .mockResolvedValueOnce(
        bindFixtureArtifact(
          manifest,
          'app/geo/population-flood-risk/pref/13.json',
          detail
        )
      );
    expect(
      await loadGeoAnalysisPrefDetail('population-flood-risk', '13')
    ).toEqual(detail);
  });
  it('比較・area・themeでも河川区分欠落の旧洪水snapshotを拒否する', () => {
    const base = snapshot('population-flood-risk');
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
