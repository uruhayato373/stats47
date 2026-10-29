import { statTileGridColumns, statTileGridFillers } from '@stats47/components';
import { describe, expect, it } from 'vitest';

/**
 * 数値タイルの格子の列の規則 (2026-10-29 オーナー決定「チャートの有無にかかわらずすべて同じ列数」)。
 *  (a) 列の上限は枚数だけで決まる (1 枚 = 1、2〜3 枚 = 2、4 枚以上 = 4)。ページから列の数を渡す口は無い
 *  (b) 3 列は使わない (男女の対比のように 2 枚 1 組のタイルがどの幅でも同じ行に並ぶ)
 *  (c) 空きマスを埋めるセルは、2 列の幅と 4 列の幅でそれぞれ必要な数だけ見える
 */
describe('statTileGridColumns', () => {
  it('(a)(b) 枚数から 1 / 2 / 4 列の上限を決め、3 列を返さない', () => {
    expect([1, 2, 3, 4, 5, 8, 23].map(statTileGridColumns)).toEqual([1, 2, 2, 4, 4, 4, 4]);
  });
});

describe('statTileGridFillers', () => {
  it('(c) 割り切れる枚数では埋めるセルを作らない', () => {
    expect(statTileGridFillers(4)).toEqual([]);
    expect(statTileGridFillers(8)).toEqual([]);
    expect(statTileGridFillers(2)).toEqual([]);
  });

  it('(c) 3 枚 (2 列が上限) は 2 列の幅で 1 つだけ埋め、4 列の規則を持たない', () => {
    const fillers = statTileGridFillers(3);
    expect(fillers).toHaveLength(1);
    expect(fillers[0]).toContain('@sm:block');
    expect(fillers[0]).not.toContain('@md:');
  });

  it('(c) 6 枚は 2 列の幅では埋めず、4 列の幅で 2 つ埋める', () => {
    const fillers = statTileGridFillers(6);
    expect(fillers).toHaveLength(2);
    for (const className of fillers) {
      expect(className).not.toContain('@sm:block');
      expect(className).toContain('@md:block');
    }
  });
});
