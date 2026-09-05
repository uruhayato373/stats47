export const POPULATION_BASELINE_RANKING_PATH =
  '/ranking/future-population-change-rate-2050';

/** 単一指標をGeo分析として公開していた旧URLの恒久転送先。 */
export const GEO_BASELINE_REDIRECTS: Readonly<Record<string, string>> = {
  '/geo/2050-population': POPULATION_BASELINE_RANKING_PATH,
};
