/**
 * e-Stat API stats-list 機能
 * ビジネスロジックとユーティリティを統合
 */

// ============================================================================
// コンポーネント
// ============================================================================
export {
  StatsFieldSidebar,
  StatsListResults,
  StatsListSearch,
  StatsTableDetailModal,
} from "./components";

// ============================================================================
// ビジネスロジック（Services）
// ============================================================================

// Fetcher
export {
  EstatErrorType,
  EstatStatsListError,
  EstatStatsListFetcher,
} from "./services/fetcher";

// Formatter
export { EstatStatsListFormatter } from "./services/formatter";

// Utils
export * from "./services/utils";

// Cache Key
export {
  generateStatsListCacheKey,
  isValidStatsListCacheKey,
  parseStatsListCacheKey,
} from "./services/cache-key";

// SWR Fetcher
export {
  statsListFetcher,
  statsListFetcherWithErrorHandling,
} from "./services/swr-fetcher";

// ============================================================================
// 型定義（coreから再エクスポート）
// ============================================================================
export type {
  AdvancedStatsListSearchOptions,
  DetailedStatsListTableInfo,
  PagingOptions,
  StatsFieldCode,
  StatsListSearchOptions,
  StatsListSearchResult,
  StatsListTableInfo,
} from "./types";

// Constants
export { STATS_FIELDS } from "./types/stats-list-response";
