import { FLOOD_ARCHIVES } from '@stats47/gis';
import { describe, expect, it } from 'vitest';

import {
  parseGeoAnalysisManifest,
  parseGeoAnalysisPrefDetail,
} from '../load-geo-analysis-evidence';

describe('Geo分析lineage parser', () => {
  it('洪水の河川区分欠落・同件数の入力差替・source出力漏れを拒否する', () => {
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
      generatedAt: '2026-09-05',
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
        {
          id: 'flood-maximum-polygons',
          outputs: inputs.map(({ key }) => ({ key })),
        },
      ],
      aggregate: {},
      quality: { expectedAreas: 47, detailAreas: 47, conservationChecks: 47 },
    };
    expect(
      parseGeoAnalysisManifest(manifest, 'population-flood-risk')
    ).not.toBeNull();
    expect(
      parseGeoAnalysisManifest(
        {
          ...manifest,
          inputs: manifest.inputs.filter(
            (input) => !('key' in input) || !input.key.includes('/source/10/')
          ),
        },
        'population-flood-risk'
      )
    ).toBeNull();
    expect(
      parseGeoAnalysisManifest(
        {
          ...manifest,
          inputs: manifest.inputs.map((input, index) =>
            index === 1
              ? { ...input, key: 'gis/mlit-ksj/A31b/25/source/10/9999.zip' }
              : input
          ),
        },
        'population-flood-risk'
      )
    ).toBeNull();
    expect(
      parseGeoAnalysisManifest(
        {
          ...manifest,
          stages: [
            manifest.stages[0],
            { id: 'flood-maximum-polygons', outputs: inputs.slice(1) },
          ],
        },
        'population-flood-risk'
      )
    ).toBeNull();
  });
  it('47県・保存則PASSのmanifestだけを受け入れる', () => {
    expect(
      parseGeoAnalysisManifest(
        {
          schemaVersion: 1,
          slug: 'population-flood-risk',
          generatedAt: '2026-08-31T00:00:00.000Z',
          definitionSha256: 'a'.repeat(64),
          inputs: [
            {
              layerId: 'population',
              role: 'calculation-input',
              usedInCalculation: true,
            },
            ...FLOOD_ARCHIVES.map(({ key }) => ({
              layerId: 'flood',
              datasetId: 'A31b',
              key,
              role: 'calculation-input',
              usedInCalculation: true,
            })),
          ],
          stages: [
            {
              id: 'flood-maximum-polygons',
              outputs: FLOOD_ARCHIVES.map(({ key }) => ({ key })),
            },
            { kind: 'spatial-operation', inputIds: ['population', 'flood'] },
          ],
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
      generatedAt: '2026-09-05T00:00:00Z',
      areaCode: '13000',
      areaName: '東京都',
      meshes: [['mesh', 139000000, 35000000, 139012500, 35008333, 100, 80]],
      landPricePoints: [['point', 139001000, 35001000, 10000, 1]],
      spatialMethod: 'point-in-mesh',
      pointMeshIds: ['mesh'],
      summary: {
        meshCount: 1,
        pointCount: 1,
        population2020: 100,
        population2050: 80,
        populationChangeRate: -20,
        medianResidentialLandPrice: 10000,
        medianLandPriceChange: 1,
        matchedPointCount: 1,
        unmatchedPointCount: 0,
        comparablePointCount: 1,
        risingDecliningPointCount: 1,
        risingDecliningPointShare: 100,
      },
    };
    expect(
      parseGeoAnalysisPrefDetail(detail, 'population-land-price', '13000')
    ).not.toBeNull();
    expect(
      parseGeoAnalysisPrefDetail(detail, 'population-land-price', '14000')
    ).toBeNull();
    expect(
      parseGeoAnalysisPrefDetail(
        { ...detail, pointMeshIds: ['missing'] },
        'population-land-price',
        '13000'
      )
    ).toBeNull();
    expect(
      parseGeoAnalysisPrefDetail(
        { ...detail, spatialMethod: undefined },
        'population-land-price',
        '13000'
      )
    ).toBeNull();
    expect(
      parseGeoAnalysisPrefDetail(
        { ...detail, summary: {} },
        'population-land-price',
        '13000'
      )
    ).toBeNull();
    expect(
      parseGeoAnalysisPrefDetail(
        {
          ...detail,
          summary: { ...detail.summary, risingDecliningPointCount: 0 },
        },
        'population-land-price',
        '13000'
      )
    ).toBeNull();
    expect(
      parseGeoAnalysisPrefDetail(
        {
          ...detail,
          landPricePoints: [['point', 140001000, 35001000, 10000, 1]],
        },
        'population-land-price',
        '13000'
      )
    ).toBeNull();
  });

  it('47県が揃っていても空間演算のない旧県コード結合を拒否する', () => {
    const manifest = {
      schemaVersion: 1,
      slug: 'population-land-price',
      generatedAt: '2026-09-05',
      definitionSha256: 'a'.repeat(64),
      inputs: [
        {
          layerId: 'population',
          role: 'calculation-input',
          usedInCalculation: true,
        },
        {
          layerId: 'price',
          role: 'calculation-input',
          usedInCalculation: true,
        },
      ],
      stages: [{ kind: 'aggregate', inputIds: ['population', 'price'] }],
      aggregate: {},
      quality: { expectedAreas: 47, detailAreas: 47, conservationChecks: 47 },
    };
    expect(
      parseGeoAnalysisManifest(manifest, 'population-land-price')
    ).toBeNull();
    expect(
      parseGeoAnalysisManifest(
        {
          ...manifest,
          stages: [
            {
              id: 'land-price-mesh-join',
              kind: 'spatial-operation',
              inputIds: ['population', 'price'],
            },
          ],
        },
        'population-land-price'
      )
    ).not.toBeNull();
  });
});
