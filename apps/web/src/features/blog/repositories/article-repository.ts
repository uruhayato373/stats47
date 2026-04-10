import "server-only";

import { articleTags, articles, tags, getDrizzle } from "@stats47/database/server";
import { and, desc, eq, inArray } from "drizzle-orm";

import { type Article, type ArticleFrontmatter } from "../types/article.types";

function toArticle(row: typeof articles.$inferSelect): Article {
  const frontmatter: ArticleFrontmatter = {
    title: row.title,
    seoTitle: row.seoTitle ?? undefined,
    description: row.description ?? undefined,
    // タグは article_tags ジャンクションテーブルを正規ソースとする。
    // articles.tags CSV は deprecated。タグが必要な場合は getTagKeysForArticle() を使用。
    tags: [],
    published: row.published === true,
    publishedAt: row.publishedAt ?? undefined,
  };

  return {
    slug: row.slug,
    title: row.title,
    seoTitle: row.seoTitle,
    description: row.description,
    filePath: row.filePath,
    published: row.published,
    publishedAt: row.publishedAt,
    format: row.format,
    hasCharts: row.hasCharts,
    ogImageType: row.ogImageType,
    ogpTitle: row.ogpTitle,
    ogpSubtitle: row.ogpSubtitle,
    proofreadAt: row.proofreadAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    content: "",
    frontmatter,
  };
}

/**
 * slug で記事メタデータを取得する。
 */
export async function findArticleBySlug(
  slug: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Article | null> {
  const drizzleDb = db ?? getDrizzle();
  const result = await drizzleDb
    .select()
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);

  if (result.length === 0) return null;
  return toArticle(result[0]);
}

/**
 * tagKey で記事検索（article_tags ジャンクション経由）
 */
export async function listArticlesByTagKey(
  tagKey: string,
  limit = 10,
  offset = 0,
  db?: ReturnType<typeof getDrizzle>
): Promise<Article[]> {
  const drizzleDb = db ?? getDrizzle();
  const rows = await drizzleDb
    .select({ slug: articles.slug })
    .from(articleTags)
    .innerJoin(articles, eq(articleTags.slug, articles.slug))
    .where(and(eq(articleTags.tagKey, tagKey), eq(articles.published, true)))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset);

  if (rows.length === 0) return [];
  const slugs = rows.map((r) => r.slug);
  const articleRows = await drizzleDb
    .select()
    .from(articles)
    .where(inArray(articles.slug, slugs))
    .orderBy(desc(articles.publishedAt));

  return articleRows.map(toArticle);
}

/**
 * 日本語タグ名で記事検索（後方互換）
 * tags テーブルで tag_name → tag_key を解決し、article_tags 経由で検索
 */
export async function listArticlesByTag(
  tag: string,
  limit = 10,
  offset = 0,
  db?: ReturnType<typeof getDrizzle>
): Promise<Article[]> {
  const drizzleDb = db ?? getDrizzle();
  const tagRow = await drizzleDb
    .select({ tagKey: tags.tagKey })
    .from(tags)
    .where(eq(tags.tagName, tag))
    .limit(1);

  if (tagRow.length === 0) return [];
  return listArticlesByTagKey(tagRow[0].tagKey, limit, offset, drizzleDb);
}

/**
 * 全公開記事のタグをカウント付きで取得する（article_tags + tags 経由、count 降順）。
 * Returns tag_key and tag_name with count, sorted by count desc.
 */
export async function listAllTagsWithCount(
  db?: ReturnType<typeof getDrizzle>
): Promise<{ tag: string; tagKey: string; count: number }[]> {
  const drizzleDb = db ?? getDrizzle();
  const rows = await drizzleDb
    .select({
      tagKey: articleTags.tagKey,
      tagName: tags.tagName,
    })
    .from(articleTags)
    .innerJoin(articles, eq(articleTags.slug, articles.slug))
    .innerJoin(tags, eq(articleTags.tagKey, tags.tagKey))
    .where(eq(articles.published, true));

  const counter = new Map<string, { tagName: string; count: number }>();
  for (const row of rows) {
    const existing = counter.get(row.tagKey);
    if (existing) {
      existing.count++;
    } else {
      counter.set(row.tagKey, { tagName: row.tagName, count: 1 });
    }
  }

  return [...counter.entries()]
    .map(([tagKey, { tagName, count }]) => ({ tag: tagName, tagKey, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 全公開記事のユニークタグキー一覧を取得する（generateStaticParams 用）。
 */
export async function listAllUniqueTags(
  db?: ReturnType<typeof getDrizzle>
): Promise<string[]> {
  const tagsData = await listAllTagsWithCount(db);
  return tagsData.map((t) => t.tagKey);
}

/**
 * 複数 slug からタイトルを一括取得する（関連記事リンクのタイトル自動解決用）。
 */
export async function findArticleTitlesBySlugs(
  slugs: string[],
  db?: ReturnType<typeof getDrizzle>
): Promise<Record<string, string>> {
  if (slugs.length === 0) return {};
  const drizzleDb = db ?? getDrizzle();
  const result = await drizzleDb
    .select({ slug: articles.slug, title: articles.title })
    .from(articles)
    .where(
      slugs.length === 1
        ? eq(articles.slug, slugs[0])
        : inArray(articles.slug, slugs)
    );
  return Object.fromEntries(result.map((r) => [r.slug, r.title]));
}

export async function listLatestArticles(
  limit = 10,
  offset = 0,
  db?: ReturnType<typeof getDrizzle>
): Promise<Article[]> {
  const drizzleDb = db ?? getDrizzle();
  const result = await drizzleDb
    .select()
    .from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.publishedAt), desc(articles.createdAt))
    .limit(limit)
    .offset(offset);

  return result.map(toArticle);
}
