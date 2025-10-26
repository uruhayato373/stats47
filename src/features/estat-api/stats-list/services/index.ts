/**
 * e-Stat API stats-list services
 * サービス層の統合エクスポート
 */

// Fetcher
export {
  EstatErrorType,
  EstatStatsListError,
  EstatStatsListFetcher,
} from "./fetcher";

// Formatter
export { EstatStatsListFormatter } from "./formatter";

// Utils
export * from "./utils";

// Cache Key
export {
  generateStatsListCacheKey,
  isValidStatsListCacheKey,
  parseStatsListCacheKey,
} from "./cache-key";

// SWR Fetcher
export {
  statsListFetcher,
  statsListFetcherWithErrorHandling,
} from "./swr-fetcher";
