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

// 関数
export {
  fetchFormattedStatsData,
  fetchStatsData,
  fetchStatsDataWithSource,
} from "./services/fetcher";
export { formatStatsData, convertToStatsSchema } from "./services/formatter";

// 型定義（Services）
export type { StatsDataSource, FetchStatsDataResult } from "./services/fetcher";

// ============================================================================
// 型定義（coreから再エクスポート）
// ============================================================================
export type {
  DataNote,
  FormattedEstatData,
  FormattedMetadata,
  FormattedTableInfo,
  FormattedValue,
} from "./types";
