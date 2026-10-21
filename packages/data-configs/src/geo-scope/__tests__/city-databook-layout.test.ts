import { describe, expect, it } from 'vitest';

import {
  CITY_DATABOOK_LAYOUT,
  listCityDatabookThemes,
  validateCityDatabookLayout,
} from '../city-databook-layout';

import type { MunicipalityThemeCatalog } from '../municipality-catalog';

const themes: Record<string, Pick<MunicipalityThemeCatalog, 'slug' | 'status' | 'title'>> = {
  population: { slug: 'population', status: 'active', title: '市区町村の人口' },
  'local-finance': { slug: 'local-finance', status: 'active', title: '地方財政' },
  draft: { slug: 'draft', status: 'draft', title: '市区町村の下書き' },
};

describe('CITY_DATABOOK_LAYOUT', () => {
  it('見出しは公開中の市区町村ランキングで、節は公開中の市区町村テーマをちょうど 1 回ずつ並べる', () => {
    expect(validateCityDatabookLayout()).toEqual([]);
    expect(CITY_DATABOOK_LAYOUT.headlineMetricKeys[0]).toBe('total-population');
  });

  it('非公開の指標・人口以外の先頭・並び順の抜けと余りを見つける', () => {
    const published = new Set(['total-population', 'fiscal-strength-index']);
    expect(
      validateCityDatabookLayout(
        { headlineMetricKeys: ['fiscal-strength-index', 'not-published'], sectionOrder: ['population', 'draft'] },
        themes,
        published
      )
    ).toEqual([
      '[city-databook-headline] 先頭は total-population にする (title が人口を使う)',
      '[city-databook-headline] not-published: 公開中の市区町村ランキングではない',
      '[city-databook-section] local-finance: テーマ名は「市区町村の◯◯」にする (節見出しに◯◯を使う)',
      '[city-databook-section] local-finance: 並び順に無い市区町村テーマ',
      '[city-databook-section] draft: 公開中の市区町村テーマではない',
    ]);
  });

  it('節はテーマの並び順で、見出しは「市区町村の」を除いた名前にする', () => {
    const themesInOrder = listCityDatabookThemes();
    expect(themesInOrder.map((theme) => theme.slug)).toEqual(CITY_DATABOOK_LAYOUT.sectionOrder);
    expect(themesInOrder[0]).toMatchObject({ slug: 'population', title: '人口' });
  });
});
