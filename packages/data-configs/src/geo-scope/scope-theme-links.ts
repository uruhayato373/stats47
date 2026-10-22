import { JAPAN_CATALOGS } from './japan-catalog';
import { KNOWN_MUNICIPALITY_THEME_SLUGS, MUNICIPALITY_THEME_CATALOGS } from './municipality-catalog';

/**
 * 統計の主語 (47都道府県 / 市区町村 / 日本) を切り替えるとき、同じ主題のページへ移るための対応表。
 *
 * テーマの分類は主語ごとに別々に作られている (都道府県 56 テーマ・市区町村 29 テーマ) ので、機械では対応しない。
 * 主題が一致すると言える組だけを人が書く。書いていないテーマは各主語の一覧ページへ移る (従来どおり)。
 */

/** 都道府県のテーマ → 同じ主題の市区町村テーマ。 */
export const MUNICIPALITY_THEME_FOR_PREFECTURE_THEME: Readonly<Record<string, string>> = {
  'aging-society': 'aging-society',
  'agriculture-production': 'agriculture-forestry',
  'business-demography': 'establishments',
  'childcare-services': 'welfare-facilities',
  'disability-support': 'welfare-facilities',
  'education-culture': 'education',
  'foreign-residents': 'foreign-residents',
  'forestry-timber': 'agriculture-forestry',
  healthcare: 'medical-welfare',
  'labor-mobility': 'commuting',
  'labor-wages': 'labor',
  'land-property-market': 'land-area',
  'living-housing': 'housing',
  'local-economy': 'establishments',
  'local-finance': 'local-finance',
  'long-term-care': 'welfare-facilities',
  manufacturing: 'manufacturing',
  'occupation-salary': 'occupations',
  'population-dynamics': 'population',
  'regional-transport': 'commuting',
  'retail-commerce': 'commerce',
  safety: 'safety-environment',
  'single-parent-households': 'households',
  'waste-recycling': 'safety-environment',
};

/** 市区町村テーマ → 同じ主題の都道府県テーマ (市区町村テーマは全件を書く)。 */
export const PREFECTURE_THEME_FOR_MUNICIPALITY_THEME: Readonly<Record<string, string>> = {
  'age-structure': 'population-dynamics',
  'age-structure-by-sex': 'population-dynamics',
  'aging-society': 'aging-society',
  'agriculture-forestry': 'agriculture-production',
  'business-sales': 'local-economy',
  commerce: 'retail-commerce',
  commuting: 'labor-mobility',
  education: 'education-culture',
  employees: 'local-economy',
  establishments: 'local-economy',
  'foreign-residents': 'foreign-residents',
  households: 'population-dynamics',
  housing: 'living-housing',
  'housing-households': 'living-housing',
  'housing-size-age': 'living-housing',
  labor: 'labor-wages',
  'land-area': 'land-property-market',
  'local-finance': 'local-finance',
  manufacturing: 'manufacturing',
  'medical-welfare': 'healthcare',
  'municipal-expenditure': 'local-finance',
  'municipal-revenue': 'local-finance',
  migration: 'population-dynamics',
  occupations: 'occupation-salary',
  population: 'population-dynamics',
  'safety-environment': 'safety',
  'urban-structure': 'living-housing',
  'vital-statistics': 'population-dynamics',
  'welfare-facilities': 'long-term-care',
};

export type StatisticsScopeHrefs = {
  prefectures?: string;
  municipalities?: string;
  japan?: string;
};

/** 都道府県のテーマページから、市区町村・日本の同じ主題へのリンク先。対応が無い主語は返さない。 */
export function scopeHrefsForPrefectureTheme(themeKey: string): StatisticsScopeHrefs {
  const municipalityTheme = MUNICIPALITY_THEME_FOR_PREFECTURE_THEME[themeKey];
  return {
    ...(municipalityTheme && KNOWN_MUNICIPALITY_THEME_SLUGS.has(municipalityTheme)
      ? { municipalities: `/municipalities/themes/${municipalityTheme}` }
      : {}),
    ...(JAPAN_CATALOGS[themeKey] ? { japan: `/japan/${themeKey}` } : {}),
  };
}

/** 市区町村テーマのページから、都道府県・日本の同じ主題へのリンク先。 */
export function scopeHrefsForMunicipalityTheme(themeSlug: string): StatisticsScopeHrefs {
  const prefectureTheme = PREFECTURE_THEME_FOR_MUNICIPALITY_THEME[themeSlug];
  if (!prefectureTheme) return {};
  return {
    prefectures: `/themes/${prefectureTheme}`,
    ...(JAPAN_CATALOGS[prefectureTheme] ? { japan: `/japan/${prefectureTheme}` } : {}),
  };
}

/** 日本のテーマページから、都道府県・市区町村の同じ主題へのリンク先 (日本と都道府県のテーマは slug が同じ)。 */
export function scopeHrefsForJapanTheme(themeSlug: string): StatisticsScopeHrefs {
  const municipalityTheme = MUNICIPALITY_THEME_FOR_PREFECTURE_THEME[themeSlug];
  return {
    prefectures: `/themes/${themeSlug}`,
    ...(municipalityTheme && KNOWN_MUNICIPALITY_THEME_SLUGS.has(municipalityTheme)
      ? { municipalities: `/municipalities/themes/${municipalityTheme}` }
      : {}),
  };
}

/**
 * 市区町村ランキングのページから、都道府県・日本の同じ主題へのリンク先。
 * 同じ key の都道府県ランキングが公開中ならそこへ、無ければ所属する市区町村テーマに対応する都道府県テーマへ。
 */
export function scopeHrefsForMunicipalityRanking(
  rankingKey: string,
  isPublishedPrefectureRanking: (rankingKey: string) => boolean
): StatisticsScopeHrefs {
  const theme = Object.values(MUNICIPALITY_THEME_CATALOGS).find(
    (candidate) => candidate.status === 'active' && candidate.metricKeys.includes(rankingKey)
  );
  const themeHrefs = theme ? scopeHrefsForMunicipalityTheme(theme.slug) : {};
  return isPublishedPrefectureRanking(rankingKey)
    ? { ...themeHrefs, prefectures: `/ranking/${rankingKey}` }
    : themeHrefs;
}
