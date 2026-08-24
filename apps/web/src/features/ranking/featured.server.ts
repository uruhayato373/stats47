import "server-only";

/**
 * home とランキング索引が使う「注目のランキング」だけの最小 entrypoint。
 *
 * `./server` はランキング詳細ページ一式 (`RankingPageClientShell` /
 * `loadRankingPageModel` / `buildFeaturedRankingCardModel` → `getMetricConfig`) も
 * export するため、索引面がカードを出すだけで METRICS_REGISTRY と詳細ページの
 * 依存グラフが dev bundle に入っていた。
 *
 * root barrel (`./server`) は互換性のため残す。
 */
export { FeaturedRankings } from "./components/FeaturedRankings";
