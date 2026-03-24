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

// 型定義のエクスポート
export type {
    RankingItem,
    RankingValue
} from "@stats47/ranking";

// 値(関数・クラス)のエクスポート。
// Web側のrepositoriesで同名関数(=Service相当)を定義しているため、
// Packageからは衝突しないものだけを厳選してエクスポートする。
export {
    computeBottomRanking,
    getRankingTitle,
    computeSortedRankings,
    computeTopRankings,
    filterOutNationalArea,
    normalizeRankingItemProperties,
    prepareHierarchicalRankings
} from "@stats47/ranking";

// クライアントコンポーネントのみをエクスポート
export { RankingBarChartRace } from "./components/RankingBarChartRace";
export { RankingBoxplotChart } from "./components/RankingBoxplotChart";
export { RankingDataTable } from "./components/RankingDataTable";
export { RankingHighlights } from "./components/RankingHighlights";
export { RankingKeyPageClient } from "./components/RankingKeyPage/RankingKeyPageClient";
export { RankingMapChartClient } from "./components/RankingMapChart/RankingMapChartClient";
export { RankingPageHeader } from "./components/RankingPageHeader";
export { RankingYearSelector } from "./components/RankingPageHeader/RankingYearSelector";
export { RankingSidebarClient } from "./components/RankingSidebar/RankingSidebarClient";
export { RankingDefinitionCard } from "./components/RankingDefinitionCard";
export { RankingSourceCard } from "./components/RankingSourceCard";
export { FeaturedRankingCard } from "./components/FeaturedRankingCard";
export type { FeaturedRankingCardProps } from "./components/FeaturedRankingCard";
export { CategoryRankingTable } from "./components/CategoryRankingList";
export type { CategoryRankingListItem } from "./components/CategoryRankingList";
export { RankingTopPageClient } from "./components/RankingTopPage";
export { AiContentAccordion } from "./components/AiContentAccordion";
export { AiMarkdownContent } from "./components/AiMarkdownContent";
export { RankingFaqSection } from "./components/RankingFaqSection";

// export * from "./repositories"; // Removed
export * from "./utils";
