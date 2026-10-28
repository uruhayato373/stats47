import { describe, expect, it } from 'vitest';

import { resolveAutoRefreshScope, type RefreshScopeMetric } from '../refresh-scope';

const metrics: Record<string, RefreshScopeMetric> = {
  'city-a': { isActive: true, entities: ['city'], sourceKind: 'estat' },
  'city-b': { isActive: true, entities: ['city'], sourceKind: 'estat' },
  'city-unpublished': { isActive: true, entities: ['city'], sourceKind: 'estat' },
  'city-manual': { isActive: true, entities: ['city'], sourceKind: 'manual' },
  'city-inactive': { isActive: false, entities: ['city'], sourceKind: 'estat' },
  'both': { isActive: true, entities: ['prefecture', 'city'], sourceKind: 'estat' },
  'pref': { isActive: true, entities: ['prefecture'], sourceKind: 'estat' },
};
const published = new Set(['city-a', 'city-b', 'city-manual', 'city-inactive', 'both']);
const lookup = {
  metric: (key: string) => metrics[key],
  isPublishedMunicipality: (key: string) => published.has(key),
};

describe('resolveAutoRefreshScope', () => {
  it('全 key が公開中の市区町村だけの指標なら市区町村の範囲を選ぶ', () => {
    expect(resolveAutoRefreshScope(['city-a', 'city-b'], lookup).scope).toBe('municipality');
  });

  it('都道府県の値も持つ指標が 1 件でも混じれば全範囲に倒す (都道府県側の派生も古くなるため)', () => {
    const result = resolveAutoRefreshScope(['city-a', 'both'], lookup);
    expect(result).toEqual({ scope: 'all', reason: 'both は市区町村だけの指標ではない' });
  });

  it('都道府県だけの指標は自動では都道府県の範囲にしない', () => {
    expect(resolveAutoRefreshScope(['pref'], lookup).scope).toBe('all');
  });

  it.each([
    [[], '指標の指定が無い (全指標)'],
    [['city-a', 'city-a'], '指標の指定が重複している'],
    [['unknown'], 'unknown は有効な指標ではない'],
    [['city-inactive'], 'city-inactive は有効な指標ではない'],
    [['city-unpublished'], 'city-unpublished は市区町村ランキングとして公開していない'],
    [['city-manual'], 'city-manual は e-Stat から取る指標ではない'],
  ])('狭くできない指定 %j は理由つきで全範囲に倒す', (keys, reason) => {
    expect(resolveAutoRefreshScope(keys, lookup)).toEqual({ scope: 'all', reason });
  });

  it('51 件以上は全範囲に倒す', () => {
    const keys = Array.from({ length: 51 }, () => 'city-a').map((key, i) => `${key}-${i}`);
    expect(resolveAutoRefreshScope(keys, lookup).scope).toBe('all');
  });
});
