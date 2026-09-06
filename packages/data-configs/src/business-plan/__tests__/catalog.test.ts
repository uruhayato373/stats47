import { describe, expect, it } from 'vitest';

import { BUSINESS_PLAN_2026 } from '../catalog';
import {
  BUSINESS_PLAN_M1_BASELINE_ANALYSIS,
  BUSINESS_PLAN_M1_GEO_ANALYSES,
} from '../m1';

describe('stats47 2.0事業計画カタログ', () => {
  it('原案の全在庫を欠落・重複なく保持する', () => {
    expect(BUSINESS_PLAN_2026.decisions).toHaveLength(25);
    expect(BUSINESS_PLAN_2026.contentOpportunities).toHaveLength(100);
    expect(BUSINESS_PLAN_2026.xIdeas).toHaveLength(30);
    expect(BUSINESS_PLAN_2026.noteProducts).toHaveLength(15);
    expect(BUSINESS_PLAN_2026.pilotSpecs).toHaveLength(4);
    expect(BUSINESS_PLAN_2026.geoContentLifecycle).toHaveLength(4);

    for (const items of [
      BUSINESS_PLAN_2026.contentOpportunities,
      BUSINESS_PLAN_2026.xIdeas,
      BUSINESS_PLAN_2026.noteProducts,
    ]) {
      expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    }
  });

  it('各Geo分析を無料・編集・SNS・有料の公開経路へ接続する', () => {
    const analysisIds = new Set(
      BUSINESS_PLAN_2026.m1.analyses.map((analysis) => analysis.id)
    );
    for (const content of BUSINESS_PLAN_2026.geoContentLifecycle) {
      expect(analysisIds.has(content.analysisId)).toBe(true);
      const analysis = BUSINESS_PLAN_2026.m1.analyses.find(
        (item) => item.id === content.analysisId
      );
      expect(content.free.canonicalPath).toBe(
        analysis?.analysisKind === 'baseline'
          ? `/ranking/${analysis.rankingKey}`
          : `/geo/${content.analysisSlug}`
      );
      expect(content.editorial.topicKey).toBe(`geo:${content.analysisSlug}`);
      expect(content.editorial.blogPath).toBe(
        `/blog/${content.editorial.blogSlug}`
      );
      expect(content.themeKeys.length).toBeGreaterThan(0);
      expect(content.paid.priceYen).toBeGreaterThan(0);
      expect(content.publicationGates.length).toBeGreaterThanOrEqual(5);
      expect(content.launch.borrowedPatterns.length).toBeGreaterThanOrEqual(2);
      expect(content.launch.reusableOutputs.length).toBeGreaterThanOrEqual(4);
      expect(content.launch.evaluationWindowDays).toBe(28);
    }
    expect(
      BUSINESS_PLAN_2026.geoContentLifecycle
        .map((content) => content.launch.order)
        .sort((a, b) => a - b)
    ).toEqual([1, 2, 3, 4]);
  });

  it('Geo公開集合へ単一指標を混ぜず、証拠階段のある空間分析だけを許可する', () => {
    expect(BUSINESS_PLAN_M1_GEO_ANALYSES).toHaveLength(3);
    expect(BUSINESS_PLAN_M1_GEO_ANALYSES).not.toContain(
      BUSINESS_PLAN_M1_BASELINE_ANALYSIS
    );

    for (const analysis of BUSINESS_PLAN_M1_GEO_ANALYSES) {
      const calculationInputs = analysis.sourceLayers.filter(
        (layer) => layer.role === 'calculation-input'
      );
      expect(analysis.analysisKind).toBe('spatial-cross');
      expect(calculationInputs.length).toBeGreaterThanOrEqual(2);
      expect(calculationInputs.map((layer) => layer.geometry)).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^(mesh|point|polygon)$/),
        ])
      );
      expect(analysis.r2Key).toMatch(/^app\/geo\//);
      expect(analysis.evidenceManifestKey).toMatch(/\/manifest\.json$/);
      expect(analysis.detailR2KeyPattern).toContain('/pref/{NN}.json');
    }
  });

  it('最初の4系列だけを実行可能にし、残りを一括量産しない', () => {
    const pilots = BUSINESS_PLAN_2026.contentOpportunities.filter(
      (item) => item.pilotOrder !== undefined
    );
    expect(
      pilots.map((item) => [item.pilotOrder, item.id, item.status])
    ).toEqual([
      [1, 'geo-001', 'ready'],
      [2, 'geo-016', 'ready'],
      [3, 'geo-031', 'ready'],
      [4, 'geo-062', 'ready'],
    ]);
    expect(
      BUSINESS_PLAN_2026.contentOpportunities.filter(
        (item) => item.status === 'candidate'
      )
    ).toHaveLength(96);
  });

  it('週次収益NSMと地域意思決定の先行指標を混在させない', () => {
    expect(
      BUSINESS_PLAN_2026.metrics.find((item) => item.id === 'weekly-revenue')
        ?.role
    ).toBe('north-star');
    expect(
      BUSINESS_PLAN_2026.metrics.find(
        (item) => item.id === 'regional-decision-sessions'
      )
    ).toMatchObject({ role: 'input', measurementStatus: 'not-instrumented' });
  });

  it('原案のD1/PostGISをDBレス正典へ適合変更する', () => {
    expect(
      BUSINESS_PLAN_2026.decisions.find((item) => item.chapter === 15)
    ).toMatchObject({
      status: 'adapted',
      owners: ['data-ingester', 'snapshot-exporter', 'r2-publisher'],
    });
  });

  it('イベント台帳が実装・計測状況を正確に区別する', () => {
    const geo = BUSINESS_PLAN_2026.events.find(
      (item) => item.id === 'geo-view'
    );
    const download = BUSINESS_PLAN_2026.events.find(
      (item) => item.id === 'data-download'
    );
    expect(geo).toMatchObject({
      status: 'partially-measured',
      canonicalEvent: 'geo_analysis_view',
    });
    expect(download).toMatchObject({
      status: 'measured',
      canonicalEvent: 'file_download',
    });
  });
});
