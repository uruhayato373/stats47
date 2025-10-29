/**
 * ランキンググループの型定義
 */

import { Subcategory } from "@/features/category";

import type { RankingItem } from "./item";

/**
 * ランキンググループの型定義
 */
export interface RankingGroup {
  groupKey: string;
  subcategoryId: string;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isCollapsed: boolean;
  items: RankingItem[];
}

/**
 * ランキンググループのレスポンス型定義
 */
export interface RankingGroupResponse {
  subcategory: Subcategory;
  groups: RankingGroup[];
  ungroupedItems: RankingItem[]; // グループに属さない項目
}

/**
 * ランキンググループのデータベース型定義
 */
export interface RankingGroupDB {
  group_key: string;
  subcategory_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_collapsed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * ランキンググループ作成時の入力型
 */
export interface CreateRankingGroupInput {
  groupKey: string;
  subcategoryId: string;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isCollapsed: boolean;
}

/**
 * ランキンググループ更新時の入力型
 */
export interface UpdateRankingGroupInput {
  groupKey?: string;
  name?: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isCollapsed?: boolean;
}

/**
 * 項目数を含むランキンググループ
 */
export interface RankingGroupWithStats extends RankingGroup {
  itemCount: number;
  ungroupedItemCount?: number;
}
