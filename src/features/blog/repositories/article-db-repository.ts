/**
 * 記事データベースリポジトリ
 *
 * D1データベースから記事メタデータを取得するRepository層
 * Server-onlyの純粋関数として実装
 */

import { getD1 } from "@/infrastructure/database/d1";

import { readMDXFile } from "./article-repository";

import type {
  Article,
  ArticleFilter,
  ArticleSortOrder,
} from "../types/article.types";

/**
 * データベースから記事メタデータを取得
 *
 * 注意: コンテンツ本体はデータベースに保存されていないため、
 * ファイルから読み込む必要があります。
 *
 * @param category - カテゴリ（ディレクトリ名）
 * @param slug - スラッグ
 * @param time - 時間（年度など）
 * @returns 記事データ（コンテンツはファイルから読み込み）
 * @throws {Error} データベースにレコードが見つからない場合
 */
export async function getArticleFromDB(
  category: string,
  slug: string,
  time: string
): Promise<Article | null> {
  const db = getD1();

  // データベースからメタデータを取得
  // 主キーは(slug, time)だが、categoryでフィルタリングも可能
  const result = await db
    .prepare(
      `
      SELECT * FROM articles 
      WHERE slug = ? AND time = ? AND category = ?
      `
    )
    .bind(slug, time, category)
    .first();

  if (!result) {
    return null;
  }

  // コンテンツはファイルから読み込む必要がある
  let content = "";

  try {
    const articleFromFile = await readMDXFile(category, slug, time);
    content = articleFromFile.content;
  } catch (error) {
    // ファイルが見つからない場合は空コンテンツ
    console.warn(
      `ファイルが見つかりません: ${category}/${slug}/${time}.mdx`,
      error
    );
  }

  // データベースのデータをArticle型に変換
  return {
    slug: result.slug as string,
    time: result.time as string,
    actualCategory: result.category as string,
    frontmatter: {
      title: result.title as string,
      description: result.description as string | undefined,
      tags: result.tags ? JSON.parse(result.tags as string) : [],
    },
    content,
  };
}

/**
 * データベースから記事一覧を取得
 *
 * @param filter - フィルタ条件
 * @param sortOrder - ソート順（デフォルト: "date-desc"）
 * @returns 記事配列（コンテンツは空、必要に応じてファイルから読み込み）
 */
export async function listArticlesFromDB(
  filter: ArticleFilter = {},
  sortOrder: ArticleSortOrder = "date-desc"
): Promise<Article[]> {
  const db = getD1();

  // クエリを構築
  let query = "SELECT * FROM articles WHERE 1=1";
  const params: any[] = [];

  // フィルタ条件を追加
  if (filter.category) {
    query += " AND category = ?";
    params.push(filter.category);
  }

  if (filter.time) {
    query += " AND time = ?";
    params.push(filter.time);
  }

  if (filter.tags && filter.tags.length > 0) {
    // tagsの部分一致検索（JSON配列内を検索）
    for (const tag of filter.tags) {
      query += " AND tags LIKE ?";
      params.push(`%${tag}%`);
    }
  }

  // ソート条件を追加
  // 注意: dateカラムが削除されたため、created_atでソート
  switch (sortOrder) {
    case "date-desc":
      query += " ORDER BY created_at DESC";
      break;
    case "date-asc":
      query += " ORDER BY created_at ASC";
      break;
    case "title-asc":
      query += " ORDER BY title ASC";
      break;
  }

  // ページネーション
  if (filter.limit) {
    query += " LIMIT ?";
    params.push(filter.limit);
  }

  if (filter.offset) {
    query += " OFFSET ?";
    params.push(filter.offset);
  }

  // データベースから取得
  const results = await db
    .prepare(query)
    .bind(...params)
    .all();

  // Article型に変換
  return results.results.map((row: any) => ({
    slug: row.slug,
    time: row.time,
    actualCategory: row.category,
    frontmatter: {
      title: row.title,
      description: row.description,
      tags: row.tags ? JSON.parse(row.tags) : [],
    },
    content: "", // コンテンツは必要に応じてファイルから読み込み
    // readingTimeはService層で動的に計算
  }));
}

/**
 * データベースから記事の総数を取得
 *
 * @param filter - フィルタ条件
 * @returns 記事総数
 */
export async function countArticlesFromDB(
  filter: ArticleFilter = {}
): Promise<number> {
  const db = getD1();

  let query = "SELECT COUNT(*) as count FROM articles WHERE 1=1";
  const params: any[] = [];

  // フィルタ条件を追加
  if (filter.category) {
    query += " AND category = ?";
    params.push(filter.category);
  }

  if (filter.time) {
    query += " AND time = ?";
    params.push(filter.time);
  }

  if (filter.tags && filter.tags.length > 0) {
    for (const tag of filter.tags) {
      query += " AND tags LIKE ?";
      params.push(`%${tag}%`);
    }
  }

  const result = await db
    .prepare(query)
    .bind(...params)
    .first();

  return result ? (result.count as number) : 0;
}
