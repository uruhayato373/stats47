/**
 * e-Stat統計表リスト機能のエクスポート
 */

// Fetcher
export {
  EstatStatsListFetcher,
  EstatErrorType,
  EstatStatsListError,
} from "./fetcher";

// Formatter
export { EstatStatsListFormatter } from "./formatter";

// Types
export type {
  StatsListSearchOptions,
  StatsListSearchResult,
  StatsListTableInfo,
  PagingOptions,
  StatsFieldCode,
  AdvancedStatsListSearchOptions,
  DetailedStatsListTableInfo,
} from "../types/stats-list";

// Utils
export * from "./utils";

// Cache Key
export {
  generateStatsListCacheKey,
  parseStatsListCacheKey,
  isValidStatsListCacheKey,
} from "./cache-key";

// SWR Fetcher
export {
  statsListFetcher,
  statsListFetcherWithErrorHandling,
} from "./swr-fetcher";
