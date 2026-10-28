import { describe, expect, it } from 'vitest';

import { buildMunicipalityEntityPolicy } from '../entity-policy';
import { listSpecialWardCodes, resolveWardModeAreas } from '../ward-mode';

const policy = buildMunicipalityEntityPolicy();

describe('政令指定都市の統合 / 分割で表示する地域', () => {
  const merged = resolveWardModeAreas(policy, 'merged');
  const split = resolveWardModeAreas(policy, 'split');

  it('merged は基礎自治体 1,741 (政令指定都市は市全体・特別区は区ごと・特別区部は入らない)', () => {
    expect(merged.codes.size).toBe(1741);
    expect(merged.codes.has('14100')).toBe(true); // 横浜市
    expect(merged.codes.has('14101')).toBe(false); // 横浜市 鶴見区
    expect(merged.codes.has('13101')).toBe(true); // 千代田区
    expect(merged.codes.has('13100')).toBe(false); // 特別区部
  });

  it('split は政令指定都市 20 を外して行政区 171 を入れる (特別区はそのまま・特別区部は入らない)', () => {
    expect(merged.designatedCityCodes.size).toBe(20);
    expect(split.codes.size).toBe(1741 - 20 + 171);
    expect(split.codes.has('14100')).toBe(false);
    expect(split.codes.has('14101')).toBe(true);
    expect(split.codes.has('13101')).toBe(true);
    expect(split.codes.has('13100')).toBe(false);
  });

  it('地図でまとめる形は merged だけが持ち、政令指定都市 → その行政区で、特別区はまとめない', () => {
    expect(merged.mergeGroups.get('14100')).toContain('14101');
    expect(merged.mergeGroups.has('13100')).toBe(false);
    expect([...merged.mergeGroups.values()].flat()).toHaveLength(171);
    expect(split.mergeGroups.size).toBe(0);
  });
});

describe('東京の特別区のコード', () => {
  it('分類が special-ward の 23 区だけ (政令指定都市の行政区・特別区部は入らない)', () => {
    const codes = listSpecialWardCodes(policy);
    expect(codes.size).toBe(23);
    expect(codes.has('13101')).toBe(true);
    expect(codes.has('13100')).toBe(false);
    expect(codes.has('14101')).toBe(false);
  });
});
