import { describe, expect, it } from 'vitest';

import { listAllMetrics } from '../../registry';
import { findGeoAnalysisByRankingKey, GEO_ANALYSES } from '../geo-analyses';

describe('Geo分析と単独ランキングの接続', () => {
  const linked = GEO_ANALYSES.flatMap((analysis) =>
    'relatedRankingKey' in analysis ? [analysis] : []
  );

  it('標高×人口の主指標ランキングが分析のcanonical着地に結び付く', () => {
    expect(findGeoAnalysisByRankingKey('low-elevation-population-ratio-5m')?.slug).toBe(
      'population-low-elevation'
    );
    expect(findGeoAnalysisByRankingKey('no-such-ranking')).toBeUndefined();
  });

  it('接続先のランキングは公開状態の県別metricとして実在し、1つの分析にだけ結び付く', () => {
    expect(linked.length).toBeGreaterThan(0);
    const metrics = new Map(listAllMetrics().map((metric) => [metric.key, metric]));
    for (const analysis of linked) {
      const metric = metrics.get(analysis.relatedRankingKey);
      expect(metric, analysis.relatedRankingKey).toBeDefined();
      expect(metric?.isActive, `${analysis.relatedRankingKey} は isActive:true`).toBe(true);
      expect(metric?.entities).toContain('prefecture');
    }
    const keys = linked.map((analysis) => analysis.relatedRankingKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
