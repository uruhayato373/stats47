import { describe, expect, it } from 'vitest';

import {
  parseGeoAnalysisManifest,
  parseGeoAnalysisPrefDetail,
} from '../load-geo-analysis-evidence';

describe('Geo分析lineage parser', () => {
  it('47県・保存則PASSのmanifestだけを受け入れる', () => {
    expect(
      parseGeoAnalysisManifest(
        {
          schemaVersion: 1,
          slug: 'population-flood-risk',
          generatedAt: '2026-08-31T00:00:00.000Z',
          definitionSha256: 'a'.repeat(64),
          inputs: [],
          stages: [],
          aggregate: {},
          quality: {
            expectedAreas: 47,
            detailAreas: 47,
            conservationChecks: 47,
          },
        },
        'population-flood-risk'
      )
    ).not.toBeNull();
    expect(
      parseGeoAnalysisManifest(
        {
          schemaVersion: 1,
          slug: 'population-flood-risk',
          generatedAt: '2026-08-31T00:00:00.000Z',
          definitionSha256: 'a'.repeat(64),
          inputs: [],
          stages: [],
          aggregate: {},
          quality: {
            expectedAreas: 47,
            detailAreas: 46,
            conservationChecks: 46,
          },
        },
        'population-flood-risk'
      )
    ).toBeNull();
  });

  it('slug・県コード・分析固有配列が一致するdetailだけを受け入れる', () => {
    const detail = {
      schemaVersion: 1,
      slug: 'population-land-price',
      areaCode: '13000',
      areaName: '東京都',
      meshes: [['mesh']],
      landPricePoints: [['point']],
      summary: {},
    };
    expect(
      parseGeoAnalysisPrefDetail(detail, 'population-land-price', '13000')
    ).not.toBeNull();
    expect(
      parseGeoAnalysisPrefDetail(detail, 'population-land-price', '14000')
    ).toBeNull();
  });
});
