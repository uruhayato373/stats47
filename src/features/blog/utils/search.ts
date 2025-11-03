/**
 * 記事検索ユーティリティ
 * 
 * 全文検索ロジックを提供
 */

import type { Article } from "../types/article.types";

/**
 * 記事を全文検索
 * 
 * @param articles - 検索対象の記事配列
 * @param query - 検索クエリ
 * @returns 検索結果の記事配列
 */
export function searchArticles(
  articles: Article[],
  query: string
): Article[] {
  if (!query || query.trim() === "") {
    return articles;
  }

  const normalizedQuery = query.toLowerCase().trim();

  return articles.filter((article) => {
    // タイトルで検索
    if (
      article.frontmatter.title.toLowerCase().includes(normalizedQuery)
    ) {
      return true;
    }

    // 説明で検索
    if (
      article.frontmatter.description
        .toLowerCase()
        .includes(normalizedQuery)
    ) {
      return true;
    }

    // コンテンツで検索
    if (article.content.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // タグで検索
    if (
      article.frontmatter.tags.some((tag) =>
        tag.toLowerCase().includes(normalizedQuery)
      )
    ) {
      return true;
    }

    // 抜粋で検索
    if (
      article.excerpt &&
      article.excerpt.toLowerCase().includes(normalizedQuery)
    ) {
      return true;
    }

    return false;
  });
}

/**
 * 検索結果をソート（関連度順）
 * 
 * @param articles - 検索結果の記事配列
 * @param query - 検索クエリ
 * @returns ソート済みの記事配列
 */
export function sortSearchResults(
  articles: Article[],
  query: string
): Article[] {
  const normalizedQuery = query.toLowerCase().trim();

  return [...articles].sort((a, b) => {
    // タイトルで一致する方が優先
    const aTitleMatch = a.frontmatter.title
      .toLowerCase()
      .includes(normalizedQuery);
    const bTitleMatch = b.frontmatter.title
      .toLowerCase()
      .includes(normalizedQuery);

    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;

    // 説明で一致する方が優先
    const aDescMatch = a.frontmatter.description
      .toLowerCase()
      .includes(normalizedQuery);
    const bDescMatch = b.frontmatter.description
      .toLowerCase()
      .includes(normalizedQuery);

    if (aDescMatch && !bDescMatch) return -1;
    if (!aDescMatch && bDescMatch) return 1;

    // タグで一致する方が優先
    const aTagMatch = a.frontmatter.tags.some((tag) =>
      tag.toLowerCase().includes(normalizedQuery)
    );
    const bTagMatch = b.frontmatter.tags.some((tag) =>
      tag.toLowerCase().includes(normalizedQuery)
    );

    if (aTagMatch && !bTagMatch) return -1;
    if (!aTagMatch && bTagMatch) return 1;

    // 日付降順（新しい順）
    return (
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
    );
  });
}

