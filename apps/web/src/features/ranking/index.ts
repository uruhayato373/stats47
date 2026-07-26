/**
 * Ranking Domain Public API
 *
 * ランキングデータの管理と表示機能を提供する統一インターフェース。
 *
 * ## 注意事項
 * - リポジトリは内部実装として扱い、Server Actions経由でのみアクセス
 *
 * @module RankingDomain
 * - **ロジックの完全共通化**: `apps/web` 内に独自実装されていた `computeSortedRankings`, `computeRankingStats` 等を `@stats47/ranking` へ移設・統合しました。
 * - **直接参照化によるシンプル化**: `apps/web` 内の `types` ディレクトリを完全に削除し、`@stats47/ranking` を直接参照するようにリファクタリングしました。これにより、冗長なブリッジファイルを排除し、より疎結合かつ直感的な構造になりました。
 * - **不整合の解消**: `listCategories` の非同期化対応や、`RankingItem` のプロパティ名変更（`name` -> `rankingName`）に伴う Web 側の cascading errors を全て修正しました。
 * - **テストの統合**: Web 側にあったテストファイルもパッケージ側の `src/utils/__tests__` へ移行し、パッケージ全体で 63 件のテストがパスする状態を確立しました。
 */

// export * from "./actions";

// クライアントコンポーネントのみをエクスポート (feature 内部のみで使う component は
// 相対 import に寄せ、barrel には app/ 他 feature から使われるものだけを置く: DR-AUDIT-07)
export { RankingDataTable } from "./components/RankingDataTable";
export { RankingMapChartClient } from "./components/RankingMapChart/RankingMapChartClient";
export { RankingYearSelector } from "./components/RankingPageHeader/RankingYearSelector";
export { RankingDefinitionCard } from "./components/RankingDefinitionCard";
export { RankingSourceCard } from "./components/RankingSourceCard";
export { FeaturedRankingCard } from "./components/FeaturedRankingCard";
export {
  getFeaturedRankingCardDefinition,
  resolveFeaturedRankingCardModel,
} from "./utils/resolve-featured-ranking-card";
export type { FeaturedRankingCardModel } from "./utils/resolve-featured-ranking-card";
export { CategoryRankingTable } from "./components/CategoryRankingList";
export type { CategoryRankingListItem } from "./components/CategoryRankingList";
export { RankingHeroCard } from "./components/RankingHeroCard";
export { DataUsageCard } from "./components/DataUsageCard";

// export * from "./repositories"; // Removed
export * from "./utils";

// Additional client components
export { AreaTypeToggle } from "./components/AreaTypeToggle";

// Sidebar cards (client)
export { SurveyCard } from "./components/RankingSidebar/SurveyCard";
