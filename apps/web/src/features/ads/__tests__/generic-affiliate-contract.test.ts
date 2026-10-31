import { describe, expect, it } from 'vitest';

import { AFFILIATE_ADS } from '../../../../scripts/affiliate-ads-data';
import { GENERIC_HIGH_VALUE_PROGRAM_REFS } from '../constants/generic-affiliate';

// 意図が決まらないページの受け皿 (2026-10-31 オーナー決定「すべてのページに広告を出す」)。
// 一覧の案件が在庫から消えると受け皿が空になり、意図が無いページに広告が出なくなる
describe('汎用で高単価の案件の一覧', () => {
  it.each(GENERIC_HIGH_VALUE_PROGRAM_REFS)('%s は在庫に、対象ランキングの指定が無い横長のバナーとして載っている', (ref) => {
    const banners = AFFILIATE_ADS.filter(
      (ad) =>
        ad.programRef === ref &&
        ad.isActive !== false &&
        ad.adType === 'banner' &&
        (ad.targetRankingKeys ?? []).length === 0 &&
        (ad.width ?? 0) >= (ad.height ?? 0),
    );
    expect(banners.length).toBeGreaterThan(0);
  });

  it('同じ案件を二度載せない', () => {
    expect(new Set(GENERIC_HIGH_VALUE_PROGRAM_REFS).size).toBe(GENERIC_HIGH_VALUE_PROGRAM_REFS.length);
  });
});
