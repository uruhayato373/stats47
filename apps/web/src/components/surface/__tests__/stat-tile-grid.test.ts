import { statTileGridFillers } from '@stats47/components';
import { describe, expect, it } from 'vitest';

/**
 * 数値タイルの格子の列の規則 (2026-10-29 オーナー決定「すべて同じ列数」「幅を 4 列にそろえる」)。
 *  (a) 列の数は本文の幅だけで決まり (1 / 2 / 4 列)、枚数では変えない。1 枚・2 枚の章も 4 列の 1 マスの幅になる
 *  (b) 3 列は使わない (男女の対比のように 2 枚 1 組のタイルがどの幅でも同じ行に並ぶ)
 *  (c) 空きマスを埋めるセルは、2 列の幅と 4 列の幅でそれぞれ必要な数だけ見える
 */
describe('statTileGridFillers', () => {
  it('(c) 4 の倍数の枚数では埋めるセルを作らない', () => {
    expect(statTileGridFillers(4)).toEqual([]);
    expect(statTileGridFillers(8)).toEqual([]);
  });

  it('(a)(c) 1 枚は 2 列の幅で 1 つ、4 列の幅で 3 つ埋める', () => {
    const fillers = statTileGridFillers(1);
    expect(fillers).toHaveLength(3);
    expect(fillers.filter((c) => c.includes('@sm:block'))).toHaveLength(1);
    expect(fillers.every((c) => c.includes('@md:block'))).toBe(true);
  });

  it('(a)(c) 2 枚は 2 列の幅では埋めず、4 列の幅で 2 つ埋める', () => {
    const fillers = statTileGridFillers(2);
    expect(fillers).toHaveLength(2);
    for (const className of fillers) {
      expect(className).not.toContain('@sm:block');
      expect(className).toContain('@md:block');
    }
  });

  it('(c) 3 枚は 2 列の幅で 1 つ、4 列の幅で 1 つ埋める', () => {
    const fillers = statTileGridFillers(3);
    expect(fillers).toHaveLength(1);
    expect(fillers[0]).toContain('@sm:block');
    expect(fillers[0]).toContain('@md:block');
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
