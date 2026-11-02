import { describe, expect, it } from 'vitest';

import { METRICS_REGISTRY } from '../registry';
import { isCapitalCityValueMetric } from './resolve-metric-provenance';

const check = (key: string) => isCapitalCityValueMetric(METRICS_REGISTRY[key]!, METRICS_REGISTRY);

describe('isCapitalCityValueMetric', () => {
  it('家計調査の品目別の指標は県庁所在市の値とみなす', () => {
    expect(check('natto-consumption-expenditure')).toBe(true);
  });

  it('社会・人口統計体系経由の家計調査の指標も県庁所在市の値とみなす', () => {
    expect(check('actual-income-worker-households-per-month')).toBe(true);
  });

  it('家計調査以外の指標は県全体の値のまま', () => {
    expect(check('total-population')).toBe(false);
  });
});
