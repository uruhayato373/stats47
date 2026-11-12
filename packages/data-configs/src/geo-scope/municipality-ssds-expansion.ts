import data from '../../../../data/municipalities/catalog/ssds-expansion.json';

/**
 * 社会・人口統計体系 (SSDS) の市区町村コードのうち、2026-10-22 まで使っていなかったものの公開判断
 * (MUNI-RANKING-EXPANSION-01)。記録の正本は台帳 `municipalities.ssds-expansion`
 * (data/municipalities/catalog/ssds-expansion.json + Schema。判定の基準は Schema の description)。
 * `municipality-catalog.ts` と `city-databook-layout.ts` が読む。
 */

/** 新設の市区町村テーマ。title は「市区町村の◯◯」(市区町村ページの節見出しに◯◯を使う)。 */
export const SSDS_EXPANSION_NEW_THEMES: Readonly<Record<string, { title: string; defaultMetricKey: string }>> = data.newThemes;

/** テーマ (既存・新設) ごとに足す指標。並びはテーマページと市区町村ページの表示順。 */
export const SSDS_EXPANSION_THEME_METRICS: Readonly<Record<string, readonly string[]>> = data.themeMetrics;

/** 0 の割合が 50% 以上の指標。0 を除いて順位を付ける (valuePolicy.minExclusive = 0)。 */
export const SSDS_EXPANSION_POSITIVE_ONLY_KEYS: readonly string[] = data.positiveOnlyKeys;

/**
 * 市区町村ページのデータブックに載せる指標。拡充分はここに挙げたものだけを載せる
 * (全件を載せると 1 ページが 2MB を超え、ページの重さの予算を外れる。残りはテーマページから見られる)。
 */
export const SSDS_EXPANSION_DATABOOK_PICKS: readonly string[] = data.databookPicks;
