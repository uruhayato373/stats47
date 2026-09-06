import { describe, expect, it } from 'vitest';
import { METRICS_REGISTRY } from '@stats47/data-configs';
import ratchet from '../../../../../.claude/config/survey-taxonomy-ratchet.json';
import { GONE_RANKING_KEYS } from '../../config/gone-ranking-keys';
import { resolveSurveyTaxonomy } from '../survey-taxonomy';

describe('approved KSJ retirement taxonomy baseline', () => {
  const adjustment = ratchet.rankingBaselineAdjustment;

  it('accounts only for the exact retired rankings and real non-survey registries', () => {
    expect(adjustment.retiredResolvedKeys).toHaveLength(9);
    expect(new Set(adjustment.retiredResolvedKeys).size).toBe(9);
    for (const key of adjustment.retiredResolvedKeys) {
      expect(METRICS_REGISTRY[key].isActive).toBe(false);
      expect(GONE_RANKING_KEYS.has(key)).toBe(true);
    }
    expect(adjustment.officialRegistryKeys).toEqual([
      'roadside-station-count', 'fishing-port-count-ksj',
    ]);
    for (const key of adjustment.officialRegistryKeys) {
      const metric = METRICS_REGISTRY[key];
      expect(metric.isActive).toBe(true);
      expect(metric.source).toMatchObject({ kind: 'external', fetcherKey: 'manual' });
      expect(resolveSurveyTaxonomy({ metricKeys: [key] }, METRICS_REGISTRY).surveys).toEqual([]);
    }
  });

  it('does not lower the floor beyond the evidenced population change', () => {
    const active = adjustment.previousActiveMetrics - adjustment.retiredResolvedKeys.length;
    const resolved = adjustment.previousActiveResolved
      - adjustment.retiredResolvedKeys.length - adjustment.officialRegistryKeys.length;
    expect(ratchet.ranking.minActiveResolved).toBeGreaterThanOrEqual(resolved);
    expect(ratchet.ranking.minActiveCoveragePct)
      .toBeGreaterThanOrEqual(Number((100 * resolved / active).toFixed(2)));
  });
});
