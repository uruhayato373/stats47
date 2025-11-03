/**
 * データベースから記事取得Server Actions
 *
 * Next.js Server Actionsとして実装
 * クライアントから直接呼び出し可能
 */

"use server";

import { listArticlesFromDB } from "../repositories/article-db-repository";

import type {
  Article,
  ArticleFilter,
  ArticleSortOrder,
} from "../types/article.types";

/**
 * データベースから記事一覧を取得（Server Action）
 *
 * @param filter - フィルタ条件
 * @param sortOrder - ソート順（デフォルト: "date-desc"）
 * @returns 記事配列（コンテンツは空）
 */
export async function getArticlesFromDBAction(
  filter: ArticleFilter = {},
  sortOrder: ArticleSortOrder = "date-desc"
): Promise<Article[]> {
  return await listArticlesFromDB(filter, sortOrder);
}
