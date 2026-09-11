import { getMetricConfig } from '@stats47/data-configs';
import { describe, expect, it } from 'vitest';

import { buildRankingItemFromMetric } from '../../../../../packages/ranking/src/builders/build-ranking-item-from-metric';
import { resolveRankingImageVisualization } from '../ranking-image-visualization';

describe('ranking image colors', () => {
  it('keeps a high-is-worse card red when raw metric config has no palette', () => {
    const config = getMetricConfig('ambulance-transported-deaths')!;
    expect(config.visualization?.colorScheme).toBeUndefined();
    const item = buildRankingItemFromMetric(config, {
      values: { yearCodes: ['2024'] },
      now: '2026-09-11T00:00:00.000Z',
    });
    expect(
      resolveRankingImageVisualization(item.visualization, config.key)
        .colorScheme
    ).toBe('interpolateReds');
  });

  it('uses the published polarity color, preserving the reversal setting', () => {
    const visualization = { colorScheme: 'interpolateReds', isReversed: true };
    expect(
      resolveRankingImageVisualization(
        visualization,
        'ambulance-transported-deaths'
      )
    ).toEqual(visualization);
  });

  it.each([undefined, null, {}, { colorScheme: 'unknown' }])(
    'rejects missing or invalid canonical visualization instead of silently rendering blue',
    (visualization) => {
      expect(() =>
        resolveRankingImageVisualization(visualization, 'test')
      ).toThrow();
    }
  );
});
