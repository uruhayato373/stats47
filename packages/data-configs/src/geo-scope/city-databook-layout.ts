import {
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  MUNICIPALITY_THEME_CATALOGS,
} from './municipality-catalog';

import type { MunicipalityThemeCatalog } from './municipality-catalog';
import {
  SSDS_EXPANSION_DATABOOK_PICKS,
  SSDS_EXPANSION_THEME_METRICS,
} from './municipality-ssds-expansion';

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
  /**
   * 節をまとめる章 (2026-11-13 オーナー決定)。26 個の表が続くと読みにくく、広告を置く切れ目も無かったので、5 つの章に分け、
   * 章の頭に値から作る 1 文を置く。章の節を順につなぐと sectionOrder と一致する (validateCityDatabookLayout が検査)
   */
  chapters: readonly CityDatabookChapter[];
}

export interface CityDatabookChapter {
  /** 章の id (ページの中のアンカーと、広告を差し込む位置の目印) */
  key: string;
  title: string;
  /** 章に入る節 (市区町村テーマの slug)。並びは sectionOrder と同じ */
  sections: readonly string[];
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
    'age-structure',
    'age-structure-by-sex',
    'households',
    'migration',
    'vital-statistics',
    'aging-society',
    'foreign-residents',
    'urban-structure',
    'local-finance',
    'municipal-revenue',
    'municipal-expenditure',
    'labor',
    'occupations',
    'commuting',
    'commerce',
    'establishments',
    'employees',
    'business-sales',
    'manufacturing',
    'agriculture-forestry',
    'medical-welfare',
    'welfare-facilities',
    'education',
    'housing',
    'housing-size-age',
    'housing-households',
    'living-environment',
    'safety-environment',
    'land-area',
  ],
  chapters: [
    {
      key: 'chapter-population',
      title: '人口と世帯',
      sections: [
        'population',
        'age-structure',
        'age-structure-by-sex',
        'households',
        'migration',
        'vital-statistics',
        'aging-society',
        'foreign-residents',
        'urban-structure',
      ],
    },
    { key: 'chapter-finance', title: '財政', sections: ['local-finance', 'municipal-revenue', 'municipal-expenditure'] },
    {
      key: 'chapter-economy',
      title: '仕事と産業',
      sections: [
        'labor',
        'occupations',
        'commuting',
        'commerce',
        'establishments',
        'employees',
        'business-sales',
        'manufacturing',
        'agriculture-forestry',
      ],
    },
    { key: 'chapter-welfare-education', title: '医療・福祉と教育', sections: ['medical-welfare', 'welfare-facilities', 'education'] },
    {
      key: 'chapter-living',
      title: '住まいと暮らしの環境',
      sections: ['housing', 'housing-size-age', 'housing-households', 'living-environment', 'safety-environment', 'land-area'],
    },
  ],
};

/**
 * データブックの節を章ごとにまとめる。節の無い章 (載せる指標の無い市区町村) は返さない。
 * ページの表示だけが使う (databook.json の形は変えない)。
 */
export function groupCityDatabookSectionsByChapter<T extends { themeSlug: string }>(
  sections: readonly T[],
  layout: CityDatabookLayout = CITY_DATABOOK_LAYOUT
): { chapter: CityDatabookChapter; sections: T[] }[] {
  return layout.chapters.flatMap((chapter) => {
    const members = sections.filter((section) => chapter.sections.includes(section.themeSlug));
    return members.length > 0 ? [{ chapter, sections: members }] : [];
  });
}

/** 市区町村テーマの title は「市区町村の◯◯」。市区町村ページの節見出しは「◯◯」だけを使う。 */
const MUNICIPALITY_THEME_TITLE_PREFIX = '市区町村の';

export interface CityDatabookTheme {
  slug: string;
  /** 節見出し (テーマ title から「市区町村の」を除いたもの)。 */
  title: string;
  metricKeys: readonly string[];
}

const SSDS_EXPANSION_KEYS = new Set(Object.values(SSDS_EXPANSION_THEME_METRICS).flat());
const SSDS_EXPANSION_PICKS = new Set(SSDS_EXPANSION_DATABOOK_PICKS);

/**
 * データブックに載せる指標か。社会・人口統計体系の拡充分 (2026-10-22・541 件) は選んだものだけを載せる。
 * 全件を載せると 1 ページの HTML が 2MB を超え、ページの重さの予算 (900KB) を外れる。残りはテーマページから見る。
 */
export function isCityDatabookMetric(metricKey: string): boolean {
  return !SSDS_EXPANSION_KEYS.has(metricKey) || SSDS_EXPANSION_PICKS.has(metricKey);
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
      metricKeys: theme.metricKeys.filter(isCityDatabookMetric),
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
  const chaptered = layout.chapters.flatMap((chapter) => chapter.sections);
  if (chaptered.join(',') !== layout.sectionOrder.join(',')) {
    errors.push('[city-databook-chapter] 章の節を順につなぐと sectionOrder と一致させる (抜け・重複・並びの違い)');
  }
  return errors;
}
