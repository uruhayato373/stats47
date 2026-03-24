import "server-only";

import { articleTags, articles, tags } from "@stats47/database/server";
import { getDrizzle } from "@stats47/database/server";
import { and, desc, eq, inArray } from "drizzle-orm";

/**
 * article_tags ジャンクションテーブル経由で tagKey に紐づく公開記事を取得
 */
export async function listArticlesByTagKey(
  tagKey: string,
  limit = 10,
  db?: ReturnType<typeof getDrizzle>
): Promise<Array<{ slug: string; title: string; description: string | null }>> {
  const drizzleDb = db ?? getDrizzle();
  const rows = await drizzleDb
    .select({
      slug: articles.slug,
      title: articles.title,
      description: articles.description,
    })
    .from(articleTags)
    .innerJoin(articles, eq(articleTags.slug, articles.slug))
    .where(and(eq(articleTags.tagKey, tagKey), eq(articles.published, true)))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);

  return rows;
}

/**
 * 記事の tagKey + tagName 一覧を取得
 */
export async function getTagKeysForArticle(
  slug: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Array<{ tagKey: string; tagName: string }>> {
  const drizzleDb = db ?? getDrizzle();
  const rows = await drizzleDb
    .select({
      tagKey: articleTags.tagKey,
      tagName: tags.tagName,
    })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagKey, tags.tagKey))
    .where(eq(articleTags.slug, slug));

  return rows;
}

/**
 * 複数記事の tagKey + tagName を一括取得（サイドバー等の表示用）
 */
export async function getTagsForArticles(
  slugs: string[],
  db?: ReturnType<typeof getDrizzle>
): Promise<Map<string, Array<{ tagKey: string; tagName: string }>>> {
  if (slugs.length === 0) return new Map();
  const drizzleDb = db ?? getDrizzle();
  const rows = await drizzleDb
    .select({
      slug: articleTags.slug,
      tagKey: articleTags.tagKey,
      tagName: tags.tagName,
    })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagKey, tags.tagKey))
    .where(
      slugs.length === 1
        ? eq(articleTags.slug, slugs[0])
        : inArray(articleTags.slug, slugs)
    );

  const result = new Map<string, Array<{ tagKey: string; tagName: string }>>();
  for (const row of rows) {
    const existing = result.get(row.slug);
    if (existing) {
      existing.push({ tagKey: row.tagKey, tagName: row.tagName });
    } else {
      result.set(row.slug, [{ tagKey: row.tagKey, tagName: row.tagName }]);
    }
  }
  return result;
}
