/**
 * e-Stat API stats-data 機能
 * UI、ビジネスロジック、ユーティリティを統合
 */

// ============================================================================
// Hooks
// ============================================================================
export * from "./hooks";

// ============================================================================
// UIコンポーネント
// ============================================================================
export * from "./components";

// ============================================================================
// ビジネスロジック（Services）
// ============================================================================

// クラス
export { EstatCSVConverter } from "./services/csv-converter";
export { EstatStatsDataFetcher } from "./services/fetcher";
export { EstatDataFilter } from "./services/filter";
export { EstatStatsDataFormatter } from "./services/formatter";

// Cache Key
export {
  generateStatsDataCacheKey,
  isValidStatsDataCacheKey,
  parseStatsDataCacheKey,
} from "./services/cache-key";

// Helpers
export * from "./services/helpers";

// ============================================================================
// 型定義（coreから再エクスポート）
// ============================================================================
export type {
  DataNote,
  FormattedEstatData,
  FormattedMetadata,
  FormattedTableInfo,
  FormattedValue,
} from "@/features/estat-api/core/types/stats-data";
