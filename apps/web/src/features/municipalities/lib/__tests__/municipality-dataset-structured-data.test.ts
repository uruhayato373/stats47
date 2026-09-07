import { describe, expect, it } from 'vitest';

import { buildMunicipalityDatasetStructuredData } from '../municipality-dataset-structured-data';

const item = {
  rankingKey: 'new-housing-floor-area',
  title: '着工新設住宅床面積',
  description: '国の統計から市・町・村の値を比較します。',
  valueCount: 792,
  source: {
    name: '社会・人口統計体系',
    url: 'https://www.e-stat.go.jp/regional-statistics/ssdsview',
  },
};

const snapshot = {
  generatedAt: '2026-09-05T08:02:37.579Z',
  yearCode: '2024',
  yearName: '2024年度',
  unit: 'm2',
  count: 792,
};

describe('buildMunicipalityDatasetStructuredData', () => {
  it('Google Datasetの必須descriptionを50文字以上で生成する', () => {
    const result = buildMunicipalityDatasetStructuredData({ item, snapshot });

    expect(result['@type']).toBe('Dataset');
    expect(result.name).toContain('2024年度');
    expect(result.description.length).toBeGreaterThanOrEqual(50);
    expect(result.description).toContain(item.description);
  });

  it('元descriptionが空でもGoogle Datasetの文字数範囲を満たす', () => {
    const result = buildMunicipalityDatasetStructuredData({
      item: { ...item, description: '' },
      snapshot,
    });

    expect(result.description.length).toBeGreaterThanOrEqual(50);
    expect(result.description.length).toBeLessThanOrEqual(5000);
  });

  it('canonical URLと実在するR2 JSON配布URLを分けて示す', () => {
    const result = buildMunicipalityDatasetStructuredData({
      item,
      snapshot,
      siteUrl: 'https://example.test/',
      r2PublicUrl: 'https://storage.example.test/',
    });

    expect(result.url).toBe(
      'https://example.test/municipalities/ranking/new-housing-floor-area'
    );
    expect(result.identifier).toBe(result.url);
    expect(result.distribution).toEqual({
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl:
        'https://storage.example.test/app/municipalities/ranking/new-housing-floor-area/values.json',
    });
  });

  it('出典・利用規約・計測単位を構造化データへ含める', () => {
    const result = buildMunicipalityDatasetStructuredData({ item, snapshot });

    expect(result.isBasedOn).toMatchObject({
      '@type': 'Dataset',
      name: item.source.name,
      url: item.source.url,
    });
    expect(result.license.url).toBe(
      'https://www.digital.go.jp/resources/open_data'
    );
    expect(result.variableMeasured.unitText).toBe('m2');
    expect(result.isAccessibleForFree).toBe(true);
  });
});
