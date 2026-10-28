import { describe, expect, it } from 'vitest';

import {
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  MUNICIPALITY_PREFECTURE_RANKING_KEYS,
} from '..';

describe('県名×市区町村ランキングの対象指標', () => {
  it('公開中の市区町村ランキングだけを対象にする (未公開の指標の県別ページを 200 で出さない)', () => {
    const unpublished = [...MUNICIPALITY_PREFECTURE_RANKING_KEYS].filter(
      (key) => !KNOWN_MUNICIPALITY_RANKING_KEYS.has(key)
    );
    expect(unpublished).toEqual([]);
  });

  it('全指標×47 県に広げず、選んだ指標に限る (薄いページの量産を止める)', () => {
    expect(MUNICIPALITY_PREFECTURE_RANKING_KEYS.size).toBeGreaterThan(0);
    expect(MUNICIPALITY_PREFECTURE_RANKING_KEYS.size).toBeLessThan(
      KNOWN_MUNICIPALITY_RANKING_KEYS.size / 10
    );
  });
});
