/**
 * ランキング型定義
 * Domain-driven Designに従い、ランキングドメインの型をここに集約
 */

// ランキング項目とランキング値の型定義
export type {
  DataSourceMetadata,
  DataSourceMetadataDB,
  RankingItem,
  RankingItemDB,
  RankingValue,
  RankingValueDB,
} from "./item";

// ランキンググループの型定義
export type {
  RankingGroup,
  RankingGroupDB,
  RankingGroupResponse,
} from "./group";

// ランキングサイドバーのProps型定義
export interface RankingItemsSidebarProps {
  /** カテゴリID */
  category: string;
  /** サブカテゴリID */
  subcategory: string;
  /** クラス名 */
  className?: string;
}
