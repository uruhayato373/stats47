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

  it('公開集合はcatalogの人手判定から導出され、除外判断が漏れない', () => {
    expect(
      getMunicipalityMetricAvailability('elderly-population-ratio')
    ).toMatchObject({
      status: 'published',
      valuePolicy: { minExclusive: 0, maxInclusive: 100 },
    });
    // 2026-09-01 に unknown を解消 (0 = 行政区+特別区部のみ、と実測) → published
    expect(
      getMunicipalityMetricAvailability('fiscal-strength-index')
    ).toMatchObject({ status: 'published', valuePolicy: { minExclusive: 0 } });
    expect(
      getMunicipalityMetricAvailability(
        'culture-recreation-cost-all-households'
      ).status
    ).toBe('unknown');
    expect(MUNICIPALITY_THEME_CATALOGS['aging-society'].status).toBe('active');
    expect(MUNICIPALITY_THEME_CATALOGS['local-finance'].status).toBe('active');

    // 全量公開 (2026-09-01 オーナー指示): 候補184 − 除外13 = 171。
    // 除外13 = cities.json不在4 + 値重複7 + データ品質監査未了2 (理由はcatalogのunsupported/unknownに記録)。
    expect(KNOWN_MUNICIPALITY_RANKING_KEYS.size).toBe(171);
    for (const key of [
      'total-population',
      'fiscal-strength-index',
      'number-of-establishments-manufacturing',
      'vacant-housing-ratio',
      'moving-in-excess-rate-japanese',
    ]) {
      expect(KNOWN_MUNICIPALITY_RANKING_KEYS.has(key)).toBe(true);
    }
    // 値重複・データ品質・cities不在の除外が公開集合に混ざらないこと
    for (const key of [
      'ratio-65-plus',
      'population-density-habitable',
      'retail-store-count-alt',
      'penal-code-offenses-recognized-per-1000',
      'industrial-land-price',
      'major-lake-area',
      'culture-recreation-cost-all-households',
    ]) {
      expect(KNOWN_MUNICIPALITY_RANKING_KEYS.has(key)).toBe(false);
    }
    expect(KNOWN_MUNICIPALITY_THEME_SLUGS.size).toBe(19);
    for (const slug of ['aging-society', 'population', 'local-finance', 'establishments']) {
      expect(KNOWN_MUNICIPALITY_THEME_SLUGS.has(slug)).toBe(true);
    }
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
