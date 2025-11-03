/**
 * タグ関連ユーティリティ
 * 
 * タグの統計情報を取得・計算する関数
 */

import type { Article } from "../types/article.types";
import type { TagStats } from "../components/TagCloud";

/**
 * 記事配列からタグ統計を計算
 * 
 * @param articles - 記事配列
 * @returns タグ統計情報の配列（使用回数降順）
 */
export function calculateTagStats(articles: Article[]): TagStats[] {
  // タグ名をキーとした使用回数のマップを作成
  const tagCountMap = new Map<string, number>();

  articles.forEach((article) => {
    if (article.frontmatter.tags && article.frontmatter.tags.length > 0) {
      article.frontmatter.tags.forEach((tag) => {
        const currentCount = tagCountMap.get(tag) || 0;
        tagCountMap.set(tag, currentCount + 1);
      });
    }
  });

  // TagStats配列に変換してソート（使用回数降順）
  const tagStats: TagStats[] = Array.from(tagCountMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return tagStats;
}

/**
 * すべてのユニークなタグを取得
 * 
 * @param articles - 記事配列
 * @returns ユニークなタグ名の配列（アルファベット順）
 */
export function getAllUniqueTags(articles: Article[]): string[] {
  const tagSet = new Set<string>();

  articles.forEach((article) => {
    if (article.frontmatter.tags && article.frontmatter.tags.length > 0) {
      article.frontmatter.tags.forEach((tag) => {
        tagSet.add(tag);
      });
    }
  });

  return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "ja"));
}

