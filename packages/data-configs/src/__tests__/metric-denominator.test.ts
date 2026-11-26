import { describe, expect, it } from 'vitest';

import { metricDenominatorOf, metricDenominatorProblem, metricDenominatorSpec } from '../metric-denominator';

const metric = (
  key: string,
  title: string,
  extra: { subtitle?: string; denominator?: 'none' | 'population' | { kind: 'population' | 'area'; per: number; scope?: string } } = {}
) => ({ key, title, ...extra });

describe('metric denominator', () => {
  it('題名と補足の分母を読む', () => {
    expect(metricDenominatorOf(metric('nurses', '人口10万対看護師数'))).toBe('population');
    expect(metricDenominatorOf(metric('facility', '社会体育施設数', { subtitle: '人口100万人当たり' }))).toBe('population');
  });
  it('明示の指定を題名より優先する', () => {
    expect(metricDenominatorOf(metric('serious-crime-per-100k', '凶悪犯認知件数', { denominator: 'none' }))).toBe('none');
  });
  it('型で書いた分母は種類を返し、規模も読める (2026-11-26 から分母は種類・規模・対象の型で持つ)', () => {
    const spec = { kind: 'population', per: 100000, scope: '65歳以上' } as const;
    // 題名・補足が別の分母を名乗っていても、書かれた型が先
    expect(metricDenominatorOf(metric('x', '面積当たりの何か', { denominator: spec }))).toBe('population');
    expect(metricDenominatorSpec({ denominator: spec })).toEqual(spec);
    expect(metricDenominatorSpec({ denominator: 'population' })).toBeNull();
    expect(metricDenominatorSpec({ denominator: 'none' })).toBeNull();
    expect(metricDenominatorProblem(metric('serious-crime-per-100k', '凶悪犯認知件数', { denominator: spec }))).toBeNull();
  });
  it('キー名だけが分母を名乗る指標を止め、明示か題名があれば通す', () => {
    expect(metricDenominatorProblem(metric('serious-crime-per-100k', '凶悪犯認知件数'))).toMatch(/serious-crime-per-100k/);
    expect(metricDenominatorProblem(metric('serious-crime-per-100k', '凶悪犯認知件数', { denominator: 'none' }))).toBeNull();
    expect(metricDenominatorProblem(metric('nurses-per-100k-population', '人口10万対看護師数'))).toBeNull();
    expect(metricDenominatorProblem(metric('retail-store-count', '小売店数'))).toBeNull();
  });
});
