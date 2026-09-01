/**
 * Ranking Package Entry Point (Client)
 */

export * from "./types";
export * from "./utils";
// 市区町村分布のビン化 (pure)。apps/web のヒストグラムと snapshot builder の焼き込みが共用する
export {
  binMunicipalityValues,
  type MunicipalityDistribution,
  type MunicipalityDistributionBin,
} from "./municipalities/bin-municipality-values";
// home/featured.json 派生の pure helper (R2 非依存)。exporter と apps/web の dev 補完が共用する
export {
  bakeHomeFeaturedItem,
  deriveFeaturedTop,
  resolveHomeFeaturedItems,
  type HomeFeaturedValueRow,
} from "./exporters/home-featured";
export {
  buildRankingItemFromMetric,
  resolveSurveyLinkage,
  yearNameOf,
  type BuildContext,
  type ValuesContext,
} from "./builders/build-ranking-item-from-metric";
export * from "./survey/survey-taxonomy";
