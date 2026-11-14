/**
 * Edge (middleware) が読む URL 可否判定用の一覧の入口。全指標 registry (`../registry`) へ値の import をつなげない
 * (`apps/web/src/__tests__/client-bundle-boundary.test.ts` が経路を固定する)。ここへ足すものも registry を import しないこと。
 */
export { JAPAN_THEME_SLUGS } from './japan-theme-slugs';
export { KNOWN_MUNICIPALITY_RANKING_KEYS, KNOWN_MUNICIPALITY_THEME_SLUGS } from './municipality-known-keys';
export { isMunicipalityPrefectureRankingKey } from './municipality-prefecture-ranking';
export { isMunicipalityThemePageSlug } from './scope-theme-map';
