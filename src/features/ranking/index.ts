/**
 * Ranking ドメイン - 後方互換性のためのエクスポート
 * 
 * 新しいサブドメイン構造への移行期間中の後方互換性を提供します。
 * 段階的に各ファイルのインポートパスを更新してください。
 */

// ============================================================================
// Items サブドメイン
// ============================================================================
export * from "./items";

// ============================================================================
// Groups サブドメイン
// ============================================================================
export * from "./groups";

// ============================================================================
// Shared コンポーネント
// ============================================================================
export { RankingMapCard } from "./shared/components/RankingMapCard";
export { RankingDataTable } from "./shared/components/RankingDataTable";

// ============================================================================
// Shared サービス
// ============================================================================
export {
  fetchDefaultRankingKey,
  fetchRankingConfig,
  fetchRankingItemsBySubcategory,
  updateVisualizationSettings,
} from "./shared/services/ranking-service";
export type {
  RankingConfig,
} from "./shared/services/ranking-service";

// ============================================================================
// Shared 型定義
// ============================================================================
export type { RankingItemsSidebarProps } from "./shared/types";

// ============================================================================
// Shared Actions
// ============================================================================
export { syncR2ToDatabaseAction } from "./shared/actions/syncR2ToDatabase";
export type { SyncResult } from "./shared/services/r2-sync-service";

// ============================================================================
// Shared Repository（後方互換性のため）
// ============================================================================
export { RankingRepository } from "./shared/repositories/ranking-repository";
export type { RankingConfigResponse, SubcategoryConfig } from "./shared/repositories/ranking-repository";

// ============================================================================
// 後方互換性のための旧エクスポート
// ============================================================================
// 以下の型は items/ または groups/ に移動しました
// - RankingItem → ./items/types
// - RankingGroup → ./groups/types
// 下記のエクスポートは旧パスから参照しているファイルがある可能性があるため残します
export type { RankingItem, RankingItemDB, RankingValue, RankingValueDB } from "./items/types";
export type {
  RankingGroup,
  RankingGroupDB,
  RankingGroupResponse,
  CreateRankingGroupInput,
  UpdateRankingGroupInput,
  RankingGroupWithStats,
} from "./groups/types";

// ============================================================================
// Admin コンポーネント（後方互換性のため）
// ============================================================================
export { RankingItemForm } from "./items/components/admin/RankingItemForm";
export { RankingItemsTable } from "./items/components/admin/RankingItemsTable";
export { RankingGroupForm } from "./groups/components/admin/RankingGroupForm";
export { GroupItemsManager } from "./groups/components/admin/GroupItemsManager";
