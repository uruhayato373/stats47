import { describe, expect, it } from 'vitest';
import { CORRELATION_SELECTION_POLICY as policy, selectCorrelationGroups } from '../selection-policy';

describe('相関の正負別選定', () => {
  it('強い正相関が多数あっても負相関の枠を奪わない', () => {
    const positives = Array.from({ length: 30 }, (_, i) => ({ rankingKey: `p-${i}`, populationAdjustedR: 0.99 - i / 1000 }));
    const negatives = Array.from({ length: 15 }, (_, i) => ({ rankingKey: `n-${i}`, populationAdjustedR: -0.8 + i / 1000 }));
    const groups = selectCorrelationGroups([...positives, ...negatives].reverse());
    expect(groups.positive).toEqual(positives.slice(0, policy.groups.positive.limit));
    expect(groups.negative).toEqual(negatives.slice(0, policy.groups.negative.limit));
  });
  it('同率はID順、0と不正値は除外し、重複を数えない', () => {
    const groups = selectCorrelationGroups([
      { rankingKey: 'b', populationAdjustedR: 0.7 }, { rankingKey: 'a', populationAdjustedR: 0.7 },
      { rankingKey: 'b', populationAdjustedR: 0.6 }, { rankingKey: 'zero', populationAdjustedR: 0 },
      { rankingKey: 'invalid', populationAdjustedR: NaN }, { rankingKey: 'range', populationAdjustedR: 1.1 },
    ]);
    expect(groups.positive.map(item => item.rankingKey)).toEqual(['a', 'b']);
    expect(groups.negative).toEqual([]);
  });
});
