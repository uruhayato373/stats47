import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import ksj from '../../../../../data/geo/ksj/datasets.json';
import analysesLedger from '../../../../../data/geo/analyses/analyses.json';
import { GEO_ANALYSIS_THEME_SOURCES } from '../geo-analysis-theme-sources';
import { GEO_ANALYSES } from '../geo-analyses';
import { BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE } from '../geo-content-lifecycle';
import { findGeoLayer, GEO_LAYERS } from '../geo-layers';
import { BUSINESS_PLAN_M1_ANALYSES, BUSINESS_PLAN_M1_GEO_ANALYSES } from '../m1';

const SLUGS = [
  'population-land-price',
  'population-flood-risk',
  'population-station-access',
  'population-snow-designation',
  'population-landslide-exposure',
  'population-low-elevation',
  'population-public-facility-access',
];

describe('Geo分析の台帳 (geo.analyses) と読み込み口', () => {
  it('7件を台帳の並びのまま出し、M1の3分析は同じ分析を先頭から引く', () => {
    expect(GEO_ANALYSES.map((analysis) => analysis.slug)).toEqual(SLUGS);
    expect(BUSINESS_PLAN_M1_GEO_ANALYSES.map((analysis) => analysis.slug)).toEqual(SLUGS.slice(0, 3));
    BUSINESS_PLAN_M1_GEO_ANALYSES.forEach((analysis, index) => {
      expect(analysis).toBe(GEO_ANALYSES[index]);
    });
  });

  it('どの分析もR2の配信先をslug配下に持つ (themeSourceの7項目は読み込み口が埋める)', () => {
    for (const analysis of GEO_ANALYSES) {
      expect(analysis.r2Key).toBe(`app/geo/${analysis.slug}/item.json`);
      expect(analysis.evidenceManifestKey).toBe(`app/geo/${analysis.slug}/manifest.json`);
      expect(analysis.detailR2KeyPattern).toBe(`app/geo/${analysis.slug}/pref/{NN}.json`);
      expect(analysis.caveats.length).toBeGreaterThan(0);
      expect(analysis.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it('themeSourceを持つ分析は、結合の関数が返すslugと台帳のキーが一致する', () => {
    const records = Object.entries(analysesLedger.analyses) as [string, { themeSource?: string }][];
    const withTheme = records.filter(([, record]) => record.themeSource);
    expect(withTheme.map(([slug]) => slug)).toEqual([
      'population-snow-designation',
      'population-landslide-exposure',
    ]);
    for (const [slug, record] of withTheme) {
      const join = (GEO_ANALYSIS_THEME_SOURCES as Record<string, () => { slug: string }>)[
        record.themeSource ?? ''
      ];
      expect(join().slug).toBe(slug);
    }
  });
});

describe('Geo層の台帳 (geo.layers)', () => {
  it('3件を台帳の並びで出し、dataIdはKSJ台帳、sourceAnalysisとrelatedはGeo分析を指す', () => {
    expect(GEO_LAYERS.map((layer) => layer.slug)).toEqual([
      'population-mesh',
      'residential-land-price',
      'station-points',
    ]);
    const analysisSlugs = new Set<string>(SLUGS);
    for (const layer of GEO_LAYERS) {
      expect(Object.keys(ksj.datasets)).toContain(layer.dataId);
      expect(analysisSlugs.has(layer.sourceAnalysis)).toBe(true);
      for (const related of layer.related) expect(analysisSlugs.has(related)).toBe(true);
      expect(findGeoLayer(layer.slug)).toBe(layer);
    }
    expect(findGeoLayer('no-such-layer')).toBeUndefined();
  });
});

describe('Geoコンテンツ公開ライフサイクルの台帳 (geo.content-lifecycle)', () => {
  it('手書きの4件をM1の分析と結合し、contentIdの並びが分析と一致する', () => {
    expect(BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE.map((content) => content.contentId)).toEqual([
      'geo-001',
      'geo-016',
      'geo-031',
      'geo-062',
    ]);
  });

  it('公開ゲートの文言は台帳の publicationGates から組み、分析の種類で中段だけを替える', () => {
    const ledger = JSON.parse(
      readFileSync(new URL('../../../../../data/geo/analyses/content-lifecycle.json', import.meta.url), 'utf8')
    );
    const gates = ledger.publicationGates;
    expect(gates?.common?.length).toBe(3);
    for (const content of BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE) {
      const analysis = BUSINESS_PLAN_M1_ANALYSES.find((item) => item.id === content.analysisId);
      const middle = analysis?.analysisKind === 'spatial-cross' ? gates.spatialCross : gates.baseline;
      expect(content.publicationGates).toEqual([...gates.common, ...middle, ...gates.closing]);
    }
    const loader = readFileSync(new URL('../geo-content-lifecycle.ts', import.meta.url), 'utf8');
    for (const text of [...gates.common, ...gates.spatialCross, ...gates.baseline, ...gates.closing]) {
      expect(loader).not.toContain(text);
    }
  });
});
