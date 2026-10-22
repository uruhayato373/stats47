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
import { METRICS_REGISTRY } from '../../registry';
import {
  SSDS_EXPANSION_POSITIVE_ONLY_KEYS,
  SSDS_EXPANSION_THEME_METRICS,
} from '../municipality-ssds-expansion';

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

  it('active city metric 全件を候補母集団として列挙し、全件に理由を持つ', () => {
    const entries = listMunicipalityMetricAvailability();
    // 母集団は MetricConfig SSOT から導出する (件数を直書きすると city entity を持つ config を
    // 1 本足すたびに落ちる。2026-09-16 に 184→188 で実際に落ちた)。
    const expectedKeys = Object.values(METRICS_REGISTRY)
      .filter((metric) => metric.isActive && metric.entities.includes('city'))
      .map((metric) => metric.key)
      .sort();
    expect(entries.map((entry) => entry.metricKey).sort()).toEqual(expectedKeys);
    expect(entries.length).toBeGreaterThanOrEqual(184);
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
    // 2026-09-16 以降に足された city entity 付き config (火災 2・自動車保険 2 等) は catalog 未登録 = unknown で、
    // 公開集合 171 には入らない (公開時に catalog へ published を書く)。
    // 2026-10-21: 令和7年国勢調査の5年間の増減 3 件を監査して published に足した (171 → 174)。
    // 2026-10-22: 主要湖沼面積を 0 (湖が無い) を除いて公開、工業地地価は 2005 年のみのため非公開に確定 (174 → 175)。
    // 2026-10-22: 社会・人口統計体系の未使用コード 733 を e-Stat 実測で判定し 542 件を公開 (175 → 717)。
    // 判定の記録と件数の内訳は municipality-ssds-expansion.ts。
    expect(KNOWN_MUNICIPALITY_RANKING_KEYS.size).toBe(717);
    for (const key of [
      'total-population',
      'fiscal-strength-index',
      'number-of-establishments-manufacturing',
      'vacant-housing-ratio',
      'moving-in-excess-rate-japanese',
      'agricultural-output',
      'major-lake-area',
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
      'culture-recreation-cost-all-households',
    ]) {
      expect(KNOWN_MUNICIPALITY_RANKING_KEYS.has(key)).toBe(false);
    }
    // 2026-10-22: 拡充分を受けるテーマを 10 件新設 (19 → 29)
    expect(KNOWN_MUNICIPALITY_THEME_SLUGS.size).toBe(29);
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
          metricKeys: ['elderly-population-ratio'],
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

describe('社会・人口統計体系の拡充 (2026-10-22)', () => {
  it('拡充の指標は既存の判定と重ならず、すべて公開・テーマ所属・市区町村対応になる', () => {
    const expansionKeys = Object.values(SSDS_EXPANSION_THEME_METRICS).flat();
    expect(new Set(expansionKeys).size).toBe(expansionKeys.length);
    expect(expansionKeys).toHaveLength(542);
    for (const key of expansionKeys) {
      expect(KNOWN_MUNICIPALITY_RANKING_KEYS.has(key)).toBe(true);
    }
  });

  it('0 の多い指標だけが 0 を除いて順位を付ける', () => {
    for (const key of SSDS_EXPANSION_POSITIVE_ONLY_KEYS) {
      expect(getMunicipalityMetricAvailability(key)).toMatchObject({ valuePolicy: { minExclusive: 0 } });
    }
    expect(getMunicipalityMetricAvailability('private-establishments')).not.toHaveProperty('valuePolicy');
  });

  it('テーマページの重さの予算を守るため、1 テーマの指標は 60 件以下', () => {
    for (const theme of Object.values(MUNICIPALITY_THEME_CATALOGS)) {
      expect(theme.metricKeys.length, theme.slug).toBeLessThanOrEqual(60);
    }
  });
});
