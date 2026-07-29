import "server-only";

// 実体は lib/ に置く (home が barrel を経由せず読めるようにするため)。
export { getFeaturedRankings } from "./lib/get-featured-rankings";

// サーバーコンポーネントの再エクスポート (app/ から使われるものだけ個別に。
// RankingKeyPage の他 section は RankingPageClientShell が相対 import で直接使う)
export { FeaturedRankings } from "./components/FeaturedRankings";
// RankingPageBreadcrumbs は ArticleShell の breadcrumb slot 用に RankingPageClientShell が
// 相対 import で直接使う (2026-07-11)。app/ からの barrel 参照は無いので個別 export しない。
export { RankingPageClientShell } from "./components/RankingKeyPage/RankingPageClientShell";
export { RankingPageHeadAssets } from "./components/RankingKeyPage/RankingPageHeadAssets";

// Cached category items reader (R2) — server-only を server entry に閉じ込め、app/ から index 経由でなく server から参照させる
export { readRankingItemsByCategory } from "./lib/cached-category-items";
export { buildFeaturedRankingCardModel } from "./lib/build-featured-ranking-card-model";

export { loadRankingPageModel } from "./services/load-ranking-page-model";
export { getRankingPageMetadata } from "./services/ranking-page-route";
