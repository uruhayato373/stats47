import { describe, expect, it } from 'vitest';

import { GEO_CROSS_ANALYSIS_SLUGS } from '../geo-cross-analysis';
import {
  parseGeoAnalysisManifest,
  parseGeoAnalysisPrefDetail,
} from '../load-geo-analysis-evidence';

import { manifestFixture } from './geo-manifest-fixture';

describe('Geo分析lineage parser', () => {
  for (const slug of GEO_CROSS_ANALYSIS_SLUGS) {
    it(`${slug}: 正常契約だけを受理しSHA・bytes・role・参照・coverage異常を拒否`, () => {
      const manifest = manifestFixture(slug);
      expect(parseGeoAnalysisManifest(manifest, slug)).not.toBeNull();
      const badInputs = [
        manifest.inputs.slice(1),
        [...manifest.inputs, manifest.inputs[0]],
        manifest.inputs.map((input, i) =>
          i ? input : { ...input, sha256: 'bad' }
        ),
        manifest.inputs.map((input, i) =>
          i ? input : { ...input, bytes: Number.POSITIVE_INFINITY }
        ),
        manifest.inputs.map((input, i) =>
          i
            ? input
            : { ...input, role: 'context-only', usedInCalculation: true }
        ),
        manifest.inputs.map((input, i) =>
          i
            ? input
            : { ...input, role: 'context-only', usedInCalculation: false }
        ),
      ];
      for (const inputs of badInputs)
        expect(
          parseGeoAnalysisManifest({ ...manifest, inputs }, slug)
        ).toBeNull();
      const badStages = [
        manifest.stages.slice(1),
        manifest.stages.map((stage, i) =>
          i ? stage : { ...stage, inputIds: ['missing-layer'] }
        ),
        manifest.stages.map((stage, i) =>
          i ? stage : { ...stage, role: 'context-only' }
        ),
        manifest.stages.map((stage, i) =>
          i ? stage : { ...stage, outputs: stage.outputs.slice(1) }
        ),
        manifest.stages.map((stage, i) =>
          i
            ? stage
            : {
                ...stage,
                outputs: stage.outputs.map((output, j) =>
                  j ? output : { ...output, sha256: 'b'.repeat(64) }
                ),
              }
        ),
        manifest.stages.map((stage, i) =>
          i
            ? stage
            : {
                ...stage,
                outputs: stage.outputs.map((output, j) =>
                  j ? output : { ...output, bytes: -1 }
                ),
              }
        ),
      ];
      for (const stages of badStages)
        expect(
          parseGeoAnalysisManifest({ ...manifest, stages }, slug)
        ).toBeNull();
      for (const patch of [
        { conservationChecks: 46 },
        { derivedRecords: 46 },
        { maxDetailBytes: 5_000_001 },
        { populatedMeshes: NaN },
      ]) {
        expect(
          parseGeoAnalysisManifest(
            { ...manifest, quality: { ...manifest.quality, ...patch } },
            slug
          )
        ).toBeNull();
      }
      expect(
        parseGeoAnalysisManifest(
          { ...manifest, generatedAt: 'not-a-date' },
          slug
        )
      ).toBeNull();
      expect(
        parseGeoAnalysisManifest(
          { ...manifest, definitionSha256: 'invalid' },
          slug
        )
      ).toBeNull();
      expect(
        parseGeoAnalysisManifest({ ...manifest, aggregate: {} }, slug)
      ).toBeNull();
    });
  }
  it('洪水の河川区分10欠落・同件数差替・source出力漏れを拒否', () => {
    const manifest = manifestFixture('population-flood-risk');
    for (const inputs of [
      manifest.inputs.filter((input) => !input.key.includes('/source/10/')),
      manifest.inputs.map((input, i) =>
        i === 47
          ? { ...input, key: 'gis/mlit-ksj/A31b/25/source/10/9999.zip' }
          : input
      ),
    ]) {
      expect(
        parseGeoAnalysisManifest(
          { ...manifest, inputs },
          'population-flood-risk'
        )
      ).toBeNull();
    }
    expect(
      parseGeoAnalysisManifest(
        {
          ...manifest,
          stages: manifest.stages.map((stage) =>
            stage.id === 'flood-maximum-polygons'
              ? { ...stage, outputs: stage.outputs.slice(1) }
              : stage
          ),
        },
        'population-flood-risk'
      )
    ).toBeNull();
  });
  it('地点対応・保存則・重複・座標の不正を拒否する', () => {
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
    for (const patch of [
      { areaCode: '14000' },
      { pointMeshIds: ['missing'] },
      { spatialMethod: undefined },
      { summary: {} },
      { landPricePoints: [['point', 140001000, 35001000, 10000, 1]] },
      {
        landPricePoints: [detail.landPricePoints[0], detail.landPricePoints[0]],
        pointMeshIds: ['mesh', 'mesh'],
      },
      { landPricePoints: [['point', 200000000, 35001000, 10000, 1]] },
    ])
      expect(
        parseGeoAnalysisPrefDetail(
          { ...detail, ...patch },
          'population-land-price',
          '13000'
        )
      ).toBeNull();
  });
});
