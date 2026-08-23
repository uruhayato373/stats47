/**
 * Ranking Package Entry Point (Client)
 */

export * from "./types";
export * from "./utils";
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
