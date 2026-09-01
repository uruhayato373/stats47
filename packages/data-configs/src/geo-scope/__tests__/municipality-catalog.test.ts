import { describe, expect, it } from 'vitest';

import {
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  KNOWN_MUNICIPALITY_THEME_SLUGS,
  MUNICIPALITY_THEME_CATALOGS,
  buildKnownMunicipalityRankingKeys,
  buildKnownMunicipalityThemeSlugs,
  getMunicipalityMetricAvailability,
  isMunicipalityStatisticsScope,
  listMunicipalityMetricAvailability,
  toGeoScopeStorageEntityKind,
  validateMunicipalityCatalogs,
} from '..';

describe('municipality geo scope and catalog', () => {
  it('municipality-setと個別municipalityだけを自治体scopeと判定する', () => {
    expect(isMunicipalityStatisticsScope({ kind: 'municipality-set' })).toBe(
      true
    );
    expect(
      isMunicipalityStatisticsScope({
        kind: 'municipality',
        municipalityCode: '01100',
        prefectureCode: '01000',
      })
    ).toBe(true);
    expect(isMunicipalityStatisticsScope({ kind: 'prefecture-set' })).toBe(
      false
    );
    expect(isMunicipalityStatisticsScope({ kind: 'japan' })).toBe(false);
  });

  it('municipalityを既存storageのcityへ一箇所で変換し、日本を県へ誤変換しない', () => {
    expect(toGeoScopeStorageEntityKind({ kind: 'municipality-set' })).toBe(
      'city'
    );
    expect(
      toGeoScopeStorageEntityKind({
        kind: 'municipality',
        municipalityCode: '01100',
        prefectureCode: '01000',
      })
    ).toBe('city');
    expect(toGeoScopeStorageEntityKind({ kind: 'prefecture-set' })).toBe(
      'prefecture'
    );
    expect(() => toGeoScopeStorageEntityKind({ kind: 'japan' })).toThrow(
      /does not use prefecture\/city storage/
    );
  });

  it('active city metric 184件を候補母集団として列挙し、全件に理由を持つ', () => {
    const entries = listMunicipalityMetricAvailability();
    expect(entries).toHaveLength(184);
    for (const { availability } of entries) {
      if (availability.status !== 'published') {
        expect(availability.reason.length).toBeGreaterThan(0);
      }
    }
  });

  it('検証済みpilotだけを公開し、地方財政は監査完了までdraftに保つ', () => {
    expect(
      getMunicipalityMetricAvailability('elderly-population-ratio')
    ).toMatchObject({
      status: 'published',
      valuePolicy: { minExclusive: 0, maxInclusive: 100 },
    });
    expect(
      getMunicipalityMetricAvailability('fiscal-strength-index').status
    ).toBe('unknown');
    expect(
      getMunicipalityMetricAvailability(
        'culture-recreation-cost-all-households'
      ).status
    ).toBe('unknown');
    expect(MUNICIPALITY_THEME_CATALOGS['aging-society'].status).toBe('active');
    expect(MUNICIPALITY_THEME_CATALOGS['local-finance'].status).toBe('draft');
    expect([...KNOWN_MUNICIPALITY_RANKING_KEYS]).toEqual([
      'elderly-population-ratio',
      // 第1拡充バッチ (2026-09-01)
      'total-population',
      'population-density-per-km2-inhabitable-area',
      'young-population-ratio',
      'production-age-population-ratio',
      'households',
      'moving-in-excess-rate',
    ]);
    expect([...KNOWN_MUNICIPALITY_THEME_SLUGS]).toEqual([
      'aging-society',
      'population',
    ]);
    expect(
      KNOWN_MUNICIPALITY_RANKING_KEYS.has(
        'culture-recreation-cost-all-households'
      )
    ).toBe(false);
  });

  it('published city metricだけをmunicipality known集合へ導出する', () => {
    const known = buildKnownMunicipalityRankingKeys({
      'elderly-population-ratio': {
        status: 'published',
        entityPolicyKey: 'standard-municipality-v1',
        comparisonModes: ['ranking'],
      },
    });
    expect([...known]).toEqual(['elderly-population-ratio']);

    expect(() =>
      buildKnownMunicipalityRankingKeys({
        'abortion-rate': {
          status: 'published',
          entityPolicyKey: 'standard-municipality-v1',
          comparisonModes: ['ranking'],
        },
      })
    ).toThrow(/must be active and support city/);
  });

  it('active themeはpublished metricだけで構成する', () => {
    const knownRanking = new Set(['elderly-population-ratio']);
    const knownThemes = buildKnownMunicipalityThemeSlugs(
      {
        'aging-society': {
          ...MUNICIPALITY_THEME_CATALOGS['aging-society'],
          status: 'active',
        },
      },
      knownRanking
    );
    expect([...knownThemes]).toEqual(['aging-society']);
  });

  it('catalogの実在・active・city・policy整合にerrorがない', () => {
    expect(validateMunicipalityCatalogs()).toEqual([]);
  });
});
