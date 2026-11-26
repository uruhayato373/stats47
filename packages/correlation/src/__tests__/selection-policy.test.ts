import { describe, expect, it } from 'vitest';
import { CORRELATION_SELECTION_POLICY as policy, correlationIdentity, isCrossGrainPair, isNearDuplicatePair, selectCorrelationGroups } from '../selection-policy';

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

// アクセス上位 20 ページの相関 400 件のうち、家計調査の品目が 27%・同じ調査のほぼ同じデータが 17% を占め、
// 同じ題名も 2 回並んでいた (2026-11-26)。規則は方針の JSON が持つ
describe('意味の薄い組を外す規則', () => {
  it('片方だけが県庁所在市の値の組は地域の単位が違うので外し、同じ単位どうしは残す', () => {
    expect(isCrossGrainPair(true, false)).toBe(policy.excludeCrossGrain);
    expect(isCrossGrainPair(false, true)).toBe(policy.excludeCrossGrain);
    expect(isCrossGrainPair(true, true)).toBe(false);
    expect(isCrossGrainPair(false, false)).toBe(false);
  });

  it('同じ主出典の調査で閾値以上の組だけを、ほぼ同じデータとして外す', () => {
    const min = policy.nearDuplicate.sameSurveyMinAbsR;
    expect(isNearDuplicatePair(true, min)).toBe(true);
    expect(isNearDuplicatePair(true, -min)).toBe(true);
    expect(isNearDuplicatePair(true, min - 0.01)).toBe(false);
    // 調査が違えば、どれだけ強くても別のデータ
    expect(isNearDuplicatePair(false, 0.99)).toBe(false);
  });

  it('同じ題名の指標は強い 1 件だけを選び、題名の無い入力は指標のキーで見分ける', () => {
    const groups = selectCorrelationGroups([
      { rankingKey: 'police-cost-a', title: '警察費', populationAdjustedR: 0.58 },
      { rankingKey: 'police-cost-b', title: '警察費', populationAdjustedR: 0.77 },
      { rankingKey: 'clinic', title: '一般診療所数', populationAdjustedR: 0.62 },
    ]);
    expect(groups.positive.map((item) => item.rankingKey)).toEqual(['police-cost-b', 'clinic']);
    expect(correlationIdentity({ rankingKey: 'a' })).toBe('key:a');
    expect(correlationIdentity({ rankingKey: 'a', title: null })).toBe('key:a');
  });
});
