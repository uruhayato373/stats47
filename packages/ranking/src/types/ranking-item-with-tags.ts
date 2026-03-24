import type { RankingItem, RankingTag } from "./ranking-item";

/**
 * タグ情報を含むランキング項目
 * 一覧表示用
 */
export interface RankingItemWithTags extends RankingItem {
  tags: RankingTag[];
}
