/**
 * 記事取得Server Actions
 * 
 * Next.js Server Actionsとして実装
 * クライアントから直接呼び出し可能
 */

"use server";

import {
  getAllArticles,
  getArticleBySlug as getArticleBySlugService,
  listArticles as listArticlesService,
} from "../services/article-service";
import type {
  Article,
  ArticleFilter,
  ArticleListResponse,
  ArticleSortOrder,
} from "../types/article.types";

/**
 * 記事一覧を取得（Server Action）
 * 
 * @param filter - フィルタ条件
 * @param sortOrder - ソート順（デフォルト: "date-desc"）
 * @returns 記事一覧レスポンス
 */
export async function getArticles(
  filter: ArticleFilter = {},
  sortOrder: ArticleSortOrder = "date-desc"
): Promise<ArticleListResponse> {
  const response = await listArticlesService(filter, sortOrder);

  // 注意: revalidateTagはrender中に使用できないため削除
  // 必要に応じて、Server Actionから明示的に呼び出す形で実装する

  return response;
}

/**
 * 記事を取得（Server Action）
 * 
 * @param category - カテゴリ
 * @param slug - スラッグ
 * @param year - 年度
 * @returns 記事データ
 * @throws {Error} 記事が見つからない場合
 */
export async function getArticle(
  category: string,
  slug: string,
  year: string
): Promise<Article> {
  const article = await getArticleBySlugService(category, slug, year);

  // 注意: revalidateTagはrender中に使用できないため削除
  // 必要に応じて、Server Actionから明示的に呼び出す形で実装する

  return article;
}

/**
 * すべての記事を取得（ページネーションなし、Server Action）
 * 
 * @param filter - フィルタ条件
 * @param sortOrder - ソート順（デフォルト: "date-desc"）
 * @returns 記事配列
 */
export async function getAllArticlesAction(
  filter: ArticleFilter = {},
  sortOrder: ArticleSortOrder = "date-desc"
): Promise<Article[]> {
  const articles = await getAllArticles(filter, sortOrder);

  // 注意: revalidateTagはrender中に使用できないため削除
  // 必要に応じて、Server Actionから明示的に呼び出す形で実装する

  return articles;
}

