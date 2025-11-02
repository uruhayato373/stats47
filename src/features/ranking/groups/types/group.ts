/**
 * Ranking Groups Domain - Type Definitions
 *
 * ランキンググループドメインの型定義を提供。
 * ランキンググループのビジネスロジック、データベース、APIレスポンスの型を定義。
 */

import { Subcategory } from "@/features/category";

import type { RankingItem } from "../../items/types";

/**
 * ランキンググループ
 *
 * 複数のランキング項目をグループ化するためのエンティティ。
 * グループはサブカテゴリに関連付けられ、複数のランキング項目を含むことができる。
 *
 * @example
 * ```typescript
 * const group: RankingGroup = {
 *   groupKey: "group-001",
 *   subcategoryIds: ["subcat-001", "subcat-002"],
 *   name: "人口統計グループ",
 *   label: "人口統計",
 *   displayOrder: 1,
 *   items: [item1, item2, item3]
 * };
 * ```
 */
export interface RankingGroup {
  /** グループの一意識別子（キー） */
  groupKey: string;
  /** 関連付けられたサブカテゴリIDの配列 */
  subcategoryIds: string[];
  /** グループ名（内部識別用） */
  name: string;
  /** グループの表示名（オプション） */
  label?: string;
  /** 表示順序（数値が小さいほど先に表示） */
  displayOrder: number;
  /** グループに属するランキング項目の配列 */
  items: RankingItem[];
}

/**
 * ランキンググループのAPIレスポンス
 *
 * サブカテゴリごとにグループ化されたランキングデータを返す際に使用する型。
 * サブカテゴリ、そのサブカテゴリに関連するグループ、未割り当ての項目を含む。
 *
 * @example
 * ```typescript
 * const response: RankingGroupResponse = {
 *   subcategory: subcategoryData,
 *   groups: [group1, group2],
 *   ungroupedItems: [item1, item2]
 * };
 * ```
 */
export interface RankingGroupResponse {
  /** 関連するサブカテゴリ情報 */
  subcategory: Subcategory;
  /** このサブカテゴリに関連するランキンググループの配列 */
  groups: RankingGroup[];
  /** グループに属していないランキング項目の配列 */
  ungroupedItems: RankingItem[];
}

/**
 * ランキンググループのデータベース表現
 *
 * データベーステーブル（`ranking_groups`）のレコード構造を表す型。
 * スネークケースのフィールド名を持つ。
 *
 * @example
 * ```typescript
 * const dbRecord: RankingGroupDB = {
 *   group_key: "group-001",
 *   group_name: "人口統計グループ",
 *   label: "人口統計",
 *   display_order: 1,
 *   created_at: "2024-01-01T00:00:00Z",
 *   updated_at: "2024-01-02T00:00:00Z"
 * };
 * ```
 */
export interface RankingGroupDB {
  /** グループの一意識別子 */
  group_key: string;
  /** グループ名 */
  group_name: string;
  /** グループの表示名（NULL許容） */
  label: string | null;
  /** 表示順序 */
  display_order: number;
  /** レコード作成日時（ISO 8601形式） */
  created_at: string;
  /** レコード更新日時（ISO 8601形式） */
  updated_at: string;
}

/**
 * ランキンググループとサブカテゴリの関連テーブル
 *
 * 多対多の関係を管理する中間テーブル（`ranking_group_subcategories`）のレコード構造。
 *
 * @example
 * ```typescript
 * const relation: RankingGroupSubcategoryDB = {
 *   group_key: "group-001",
 *   subcategory_id: "subcat-001",
 *   display_order: 1,
 *   created_at: "2024-01-01T00:00:00Z"
 * };
 * ```
 */
export interface RankingGroupSubcategoryDB {
  /** グループの一意識別子 */
  group_key: string;
  /** サブカテゴリの一意識別子 */
  subcategory_id: string;
  /** このサブカテゴリ内でのグループの表示順序 */
  display_order: number;
  /** 関連付けの作成日時（ISO 8601形式） */
  created_at: string;
}

/**
 * ランキンググループ作成時の入力データ
 *
 * 新しいランキンググループを作成する際に必要なデータ。
 * すべての必須フィールドを含む。
 *
 * @example
 * ```typescript
 * const input: CreateRankingGroupInput = {
 *   groupKey: "group-001",
 *   subcategoryIds: ["subcat-001", "subcat-002"],
 *   group_name: "人口統計グループ",
 *   label: "人口統計",
 *   displayOrder: 1
 * };
 * ```
 */
export interface CreateRankingGroupInput {
  /** グループの一意識別子 */
  groupKey: string;
  /** 関連付けられるサブカテゴリIDの配列（最低1つ必要） */
  subcategoryIds: string[];
  /** グループ名 */
  group_name: string;
  /** グループの表示名（オプション） */
  label?: string;
  /** 表示順序 */
  displayOrder: number;
}

/**
 * ランキンググループ更新時の入力データ
 *
 * 既存のランキンググループを更新する際に使用するデータ。
 * すべてのフィールドがオプションで、指定されたフィールドのみが更新される。
 *
 * @example
 * ```typescript
 * const input: UpdateRankingGroupInput = {
 *   group_name: "更新されたグループ名",
 *   displayOrder: 2
 * };
 * ```
 */
export interface UpdateRankingGroupInput {
  /** グループの一意識別子（通常は更新しない） */
  groupKey?: string;
  /** 関連付けられるサブカテゴリIDの配列（指定時は既存の関連を全て置き換え） */
  subcategoryIds?: string[];
  /** グループ名 */
  group_name?: string;
  /** グループの表示名 */
  label?: string;
  /** 表示順序 */
  displayOrder?: number;
}

/**
 * 統計情報を含むランキンググループ
 *
 * ランキンググループに加えて、項目数の統計情報を含む拡張型。
 * 一覧表示やダッシュボード表示などで使用される。
 *
 * @example
 * ```typescript
 * const groupWithStats: RankingGroupWithStats = {
 *   ...group,
 *   itemCount: 10,
 *   ungroupedItemCount: 5
 * };
 * ```
 */
export interface RankingGroupWithStats extends RankingGroup {
  /** このグループに属する項目数 */
  itemCount: number;
  /** 未割り当ての項目数（オプション） */
  ungroupedItemCount?: number;
}

