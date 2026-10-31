import { JAPAN_CATALOGS } from './japan-catalog';
import { KNOWN_MUNICIPALITY_THEME_SLUGS, MUNICIPALITY_THEME_CATALOGS } from './municipality-catalog';
import { MUNICIPALITY_THEME_FOR_PREFECTURE_THEME, PREFECTURE_THEME_FOR_MUNICIPALITY_THEME } from './scope-theme-map';

/**
 * 統計の主語 (47都道府県 / 市区町村 / 日本) を切り替えるとき、同じ主題のページへ移るための対応表。
 *
 * テーマの分類は主語ごとに別々に作られている (都道府県 56 テーマ・市区町村 29 テーマ) ので、機械では対応しない。
 * 主題が一致すると言える組だけを人が書く。書いていないテーマは各主語の一覧ページへ移る (従来どおり)。
 */

export {
  MUNICIPALITY_THEME_FOR_PREFECTURE_THEME,
  PREFECTURE_THEME_FOR_MUNICIPALITY_THEME,
} from './scope-theme-map';
/** 都道府県のテーマに対応する市区町村テーマ (1 対 1 の対応と、市区町村テーマ側から寄せた分をまとめる)。公開中のものだけ */
export function municipalityThemesForPrefectureTheme(themeKey: string) {
  const slugs = new Set<string>();
  const primary = MUNICIPALITY_THEME_FOR_PREFECTURE_THEME[themeKey];
  if (primary) slugs.add(primary);
  for (const [municipalitySlug, prefectureTheme] of Object.entries(PREFECTURE_THEME_FOR_MUNICIPALITY_THEME)) {
    if (prefectureTheme === themeKey) slugs.add(municipalitySlug);
  }
  return [...slugs]
    .map((slug) => MUNICIPALITY_THEME_CATALOGS[slug])
    .filter((theme) => theme !== undefined && theme.status === 'active');
}

/** 都道府県のテーマで見せる市区町村の指標 (対応する市区町村テーマの指標をまとめ、重複を除く) */
export function municipalityMetricKeysForPrefectureTheme(themeKey: string): string[] {
  return [...new Set(municipalityThemesForPrefectureTheme(themeKey).flatMap((theme) => theme.metricKeys))];
}

/** 「全国の市区町村を比べる」ページの slug の一覧 (都道府県のテーマ名。公開中の市区町村テーマを持つもの) */
export const MUNICIPALITY_THEME_PAGE_SLUGS: readonly string[] = Object.keys(MUNICIPALITY_THEME_FOR_PREFECTURE_THEME).filter(
  (themeKey) => municipalityThemesForPrefectureTheme(themeKey).length > 0
);

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
      ? { municipalities: `/municipalities/themes/${themeKey}` }
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
      ? { municipalities: `/municipalities/themes/${themeSlug}` }
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
