import {
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  MUNICIPALITY_THEME_CATALOGS,
} from './municipality-catalog';

import type { MunicipalityThemeCatalog } from './municipality-catalog';

/**
 * 市区町村ページ (`/areas/<県>/cities/<市区町村>`) の「データブック」の配置。
 *
 * 指標の分類 (タクソノミー) は新しく作らず、市区町村テーマ `MUNICIPALITY_THEME_CATALOGS` をそのまま節にする。
 * ここで決めるのは、ページの先頭に出す見出しの指標と、節の並び順だけ。値と順位は市区町村ランキングの
 * 配信値 (`app/municipalities/ranking/<key>/values.json`) を市区町村ごとに束ねた `databook.json` が持つ。
 */
export interface CityDatabookLayout {
  /**
   * 見出しの KPI。先頭は人口で、title・説明文にも使う (「◯◯市 人口」の検索が最も多い。2026-10-21 の GSC 実測)。
   * どれも公開中の市区町村ランキングに限る。
   */
  headlineMetricKeys: readonly string[];
  /** 節の並び順。市区町村テーマの slug を全件ちょうど 1 回ずつ並べる。 */
  sectionOrder: readonly string[];
}

export const CITY_DATABOOK_POPULATION_METRIC_KEY = 'total-population';

export const CITY_DATABOOK_LAYOUT: CityDatabookLayout = {
  headlineMetricKeys: [
    CITY_DATABOOK_POPULATION_METRIC_KEY,
    'elderly-population-ratio',
    'households',
    'moving-in-excess-rate',
    'per-taxpayer-income',
    'fiscal-strength-index',
  ],
  sectionOrder: [
    'population',
    'households',
    'migration',
    'vital-statistics',
    'aging-society',
    'foreign-residents',
    'urban-structure',
    'local-finance',
    'labor',
    'commuting',
    'commerce',
    'establishments',
    'manufacturing',
    'agriculture-forestry',
    'medical-welfare',
    'education',
    'housing',
    'safety-environment',
    'land-area',
  ],
};

/** 市区町村テーマの title は「市区町村の◯◯」。市区町村ページの節見出しは「◯◯」だけを使う。 */
const MUNICIPALITY_THEME_TITLE_PREFIX = '市区町村の';

export interface CityDatabookTheme {
  slug: string;
  /** 節見出し (テーマ title から「市区町村の」を除いたもの)。 */
  title: string;
  metricKeys: readonly string[];
}

/** 節の並び順に市区町村テーマを並べる。データブックの生成とページが同じ並びを使う。 */
export function listCityDatabookThemes(
  layout: CityDatabookLayout = CITY_DATABOOK_LAYOUT,
  themes: Readonly<Record<string, MunicipalityThemeCatalog>> = MUNICIPALITY_THEME_CATALOGS
): CityDatabookTheme[] {
  return layout.sectionOrder.map((slug) => {
    const theme = themes[slug];
    if (!theme) throw new Error(`city databook section is not a municipality theme: ${slug}`);
    return {
      slug,
      title: theme.title.slice(MUNICIPALITY_THEME_TITLE_PREFIX.length),
      metricKeys: theme.metricKeys,
    };
  });
}

export function validateCityDatabookLayout(
  layout: CityDatabookLayout = CITY_DATABOOK_LAYOUT,
  themes: Readonly<Record<string, Pick<MunicipalityThemeCatalog, 'slug' | 'status' | 'title'>>> = MUNICIPALITY_THEME_CATALOGS,
  publishedKeys: ReadonlySet<string> = KNOWN_MUNICIPALITY_RANKING_KEYS
): string[] {
  const errors: string[] = [];
  if (layout.headlineMetricKeys[0] !== CITY_DATABOOK_POPULATION_METRIC_KEY) {
    errors.push(`[city-databook-headline] 先頭は ${CITY_DATABOOK_POPULATION_METRIC_KEY} にする (title が人口を使う)`);
  }
  for (const key of layout.headlineMetricKeys) {
    if (!publishedKeys.has(key)) errors.push(`[city-databook-headline] ${key}: 公開中の市区町村ランキングではない`);
  }
  if (new Set(layout.headlineMetricKeys).size !== layout.headlineMetricKeys.length) {
    errors.push('[city-databook-headline] 指標が重複している');
  }
  const activeThemes = Object.values(themes).filter((theme) => theme.status === 'active');
  const activeSlugs = activeThemes.map((theme) => theme.slug);
  for (const theme of activeThemes) {
    if (!theme.title.startsWith(MUNICIPALITY_THEME_TITLE_PREFIX) || theme.title === MUNICIPALITY_THEME_TITLE_PREFIX) {
      errors.push(`[city-databook-section] ${theme.slug}: テーマ名は「${MUNICIPALITY_THEME_TITLE_PREFIX}◯◯」にする (節見出しに◯◯を使う)`);
    }
  }
  const ordered = new Set(layout.sectionOrder);
  if (ordered.size !== layout.sectionOrder.length) errors.push('[city-databook-section] 並び順に重複がある');
  for (const slug of activeSlugs) {
    if (!ordered.has(slug)) errors.push(`[city-databook-section] ${slug}: 並び順に無い市区町村テーマ`);
  }
  for (const slug of layout.sectionOrder) {
    if (!activeSlugs.includes(slug)) errors.push(`[city-databook-section] ${slug}: 公開中の市区町村テーマではない`);
  }
  return errors;
}
