// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { rankingTop1Label } from '../ranking-top1-label';

describe('rankingTop1Label', () => {
  it('家計調査の値は県庁所在市の値なので、1 位を市の名前で書く', () => {
    expect(
      rankingTop1Label({
        rankingKey: 'natto-consumption-expenditure',
        unit: '円',
        top1: { areaName: '福島県', value: '7,658' },
      })
    ).toBe('福島市 7,658円');
  });

  it('県全体の値の指標は県名のまま書く', () => {
    expect(
      rankingTop1Label({ rankingKey: 'total-population', unit: '人', top1: { areaName: '東京都', value: '14,047,594' } })
    ).toBe('東京都 14,047,594人');
  });

  it('値の無い指標は null', () => {
    expect(rankingTop1Label({ rankingKey: 'total-population', unit: '人', top1: null })).toBeNull();
  });
});
