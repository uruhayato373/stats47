/**
 * 統計の主語 (47都道府県 / 市区町村 / 日本) をまたいで同じ主題のテーマを対応させる表 (重い定義を import しない)。
 *
 * middleware (`/areas/県/テーマ/cities` を通すか) からも読むので、市区町村・全国のカタログ (指標の台帳を import する) と
 * 分けて置く (2026-10-31 IA-REGION-THEME-01)。主題が一致すると言える組だけを人が書く。
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

/**
 * 「全国の市区町村を比べる」ページの slug (都道府県のテーマ名にそろえる。2026-10-31 オーナー決定 IA-REGION-THEME-01)。
 * 市区町村の対応がある都道府県のテーマ。ページは対応する市区町村テーマの指標をまとめて出す (`/municipalities/themes/<slug>`)。
 */
export function isMunicipalityThemePageSlug(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(MUNICIPALITY_THEME_FOR_PREFECTURE_THEME, slug);
}

/**
 * 旧 市区町村テーマの slug から、今のページの slug (都道府県のテーマ名) を引く。今の slug と同じなら同じ値を返す。
 * middleware が旧 URL (`/municipalities/themes/households` など) を 301 するのに使う。
 */
export function municipalityThemePageSlugFor(slug: string): string | undefined {
  if (isMunicipalityThemePageSlug(slug)) return slug;
  return PREFECTURE_THEME_FOR_MUNICIPALITY_THEME[slug];
}
