import { describe, expect, it } from 'vitest';

import { JAPAN_CATALOGS } from '../japan-catalog';
import { JAPAN_THEME_SLUGS, KNOWN_MUNICIPALITY_RANKING_KEYS, KNOWN_MUNICIPALITY_THEME_SLUGS } from '../edge-keys';
import { buildKnownMunicipalityRankingKeys, buildKnownMunicipalityThemeSlugs } from '../municipality-catalog';

/**
 * Edge 向けの軽い一覧 (registry を import しない) が、registry で照合する本体の一覧と同じ集合であることを固定する。
 * 経路 (registry へ届かないこと) の検査は apps/web の client-bundle-boundary.test.ts が持つ。
 */
describe('edge-keys (MIDDLEWARE-REGISTRY-BUNDLE-01)', () => {
  it('JAPAN_THEME_SLUGS は JAPAN_CATALOGS のキーと一致する', () => {
    expect([...JAPAN_THEME_SLUGS].sort()).toEqual(Object.keys(JAPAN_CATALOGS).sort());
  });

  it('市区町村の公開済みランキングのキーは registry 照合つきの組み立てと一致する', () => {
    expect([...KNOWN_MUNICIPALITY_RANKING_KEYS].sort()).toEqual([...buildKnownMunicipalityRankingKeys()].sort());
    expect(KNOWN_MUNICIPALITY_RANKING_KEYS.size).toBeGreaterThan(0);
  });

  it('市区町村のテーマ slug は本体の組み立てと一致する', () => {
    expect([...KNOWN_MUNICIPALITY_THEME_SLUGS].sort()).toEqual([...buildKnownMunicipalityThemeSlugs()].sort());
    expect(KNOWN_MUNICIPALITY_THEME_SLUGS.size).toBeGreaterThan(0);
  });
});
