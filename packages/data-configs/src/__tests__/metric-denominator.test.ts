import { describe, expect, it } from 'vitest';

import { metricDenominatorOf, metricDenominatorProblem } from '../metric-denominator';

const metric = (key: string, title: string, extra: { subtitle?: string; denominator?: 'none' | 'population' } = {}) => ({ key, title, ...extra });

describe('metric denominator', () => {
  it('題名と補足の分母を読む', () => {
    expect(metricDenominatorOf(metric('nurses', '人口10万対看護師数'))).toBe('population');
    expect(metricDenominatorOf(metric('facility', '社会体育施設数', { subtitle: '人口100万人当たり' }))).toBe('population');
  });
  it('明示の指定を題名より優先する', () => {
    expect(metricDenominatorOf(metric('serious-crime-per-100k', '凶悪犯認知件数', { denominator: 'none' }))).toBe('none');
  });
  it('キー名だけが分母を名乗る指標を止め、明示か題名があれば通す', () => {
    expect(metricDenominatorProblem(metric('serious-crime-per-100k', '凶悪犯認知件数'))).toMatch(/serious-crime-per-100k/);
    expect(metricDenominatorProblem(metric('serious-crime-per-100k', '凶悪犯認知件数', { denominator: 'none' }))).toBeNull();
    expect(metricDenominatorProblem(metric('nurses-per-100k-population', '人口10万対看護師数'))).toBeNull();
    expect(metricDenominatorProblem(metric('retail-store-count', '小売店数'))).toBeNull();
  });
});
