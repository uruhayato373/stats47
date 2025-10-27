/**
 * e-Stat API meta-info 機能
 * UI、ビジネスロジック、ユーティリティを統合
 */

// ============================================================================
// UIコンポーネント
// ============================================================================
export * from "./components";

// ============================================================================
// React Hooks
// ============================================================================
export * from "./hooks";

// ============================================================================
// ビジネスロジック（Services）
// ============================================================================

// 型定義
export type {
  BatchProcessOptions,
  BatchProcessResult,
} from "./services/batch-processor";

// クラス
export { EstatMetaInfoBatchProcessor } from "./services/batch-processor";

// 関数
export { fetchAndTransformMetaInfo, fetchMetaInfo } from "./services/fetcher";
export {
  extractCategories,
  extractTableInfo,
  extractTimeAxis,
  parseCompleteMetaInfo,
} from "./services/formatter";
export {
  formatEstatId,
  generateEstatIdRange,
  normalizeEstatId,
  validateEstatId,
  validateEstatIdFormat,
} from "./services/id-utils";

// ============================================================================
// ユーティリティ関数
// ============================================================================
export * from "./utils";
