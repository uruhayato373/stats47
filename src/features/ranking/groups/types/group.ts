/**
 * ランキンググループの型定義
 */

import { Subcategory } from "@/features/category";

import type { RankingItem } from "../../items/types";

/**
 * ランキンググループの型定義
 */
export interface RankingGroup {
  groupKey: string;
  subcategoryId: string;
  name: string;
  label?: string;
  icon?: string;
  displayOrder: number;
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
  group_name: string;
  label: string | null;
  icon: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * ランキンググループ作成時の入力型
 */
export interface CreateRankingGroupInput {
  groupKey: string;
  subcategoryId: string;
  group_name: string;
  label?: string;
  icon?: string;
  displayOrder: number;
}

/**
 * ランキンググループ更新時の入力型
 */
export interface UpdateRankingGroupInput {
  groupKey?: string;
  group_name?: string;
  label?: string;
  icon?: string;
  displayOrder?: number;
}

/**
 * 項目数を含むランキンググループ
 */
export interface RankingGroupWithStats extends RankingGroup {
  itemCount: number;
  ungroupedItemCount?: number;
}

