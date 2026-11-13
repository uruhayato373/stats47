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
    ).toBe('東京都 1,405万人');
  });

  // 一覧の「1 位」の列に「北海道 656,171,677千円」と書いていた (UNIT-NOTATION-FORMAT-01)。ランキングのページと同じ表示単位にする
  it('桁の多い金額は表示単位に寄せ、定義が表示単位を書いていればそれを使う', () => {
    expect(
      rankingTop1Label({
        rankingKey: 'total-population',
        unit: '千円',
        top1: { areaName: '北海道', value: '656,171,677' },
      })
    ).toBe('北海道 6,562億円');
    // 可処分所得は定義が「円 → 万円・小数 1 桁」と書いている。家計調査なので名前は県庁所在市
    expect(
      rankingTop1Label({
        rankingKey: 'disposable-income-worker-households',
        unit: '円',
        top1: { areaName: '埼玉県', value: '639,356' },
      })
    ).toBe('さいたま市 63.9万円');
  });

  it('値の無い指標は null', () => {
    expect(rankingTop1Label({ rankingKey: 'total-population', unit: '人', top1: null })).toBeNull();
  });
});
