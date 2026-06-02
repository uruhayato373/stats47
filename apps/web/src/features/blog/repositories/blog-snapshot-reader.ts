import "server-only";

import { createSnapshotReader } from "@stats47/r2-storage/server";

import {
  BLOG_SNAPSHOT_KEY,
  type BlogSnapshot,
  type SnapshotArticle,
  type SnapshotTagMeta,
} from "../types/snapshot";

import type { Article, ArticleFrontmatter } from "../types/article.types";

// module-level キャッシュは持たない (r2-storage-design.md)。
// re-push 直後の取りこぼしや warm isolate の stale 保持を防ぐため毎回 R2 を直接 fetch する。
const loadSnapshot = createSnapshotReader<BlogSnapshot, BlogSnapshot>({
  key: BLOG_SNAPSHOT_KEY,
  label: "blog",
  select: (snapshot) => snapshot,
  fallback: { generatedAt: new Date(0).toISOString(), articles: [], tagMeta: [] },
});

function toArticle(row: SnapshotArticle): Article {
  const frontmatter: ArticleFrontmatter = {
    title: row.title,
    seoTitle: row.seoTitle ?? undefined,
    description: row.description ?? undefined,
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
    proofreadAt: row.proofreadAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: JSON.stringify(row.tags ?? []),
    content: "",
    frontmatter,
  };
}

function compareByPublishedAtDesc(a: SnapshotArticle, b: SnapshotArticle): number {
  const ap = a.publishedAt ?? "";
  const bp = b.publishedAt ?? "";
  if (ap !== bp) return ap < bp ? 1 : -1;
  const ac = a.createdAt ?? "";
  const bc = b.createdAt ?? "";
  if (ac !== bc) return ac < bc ? 1 : -1;
  return 0;
}

export async function readArticleBySlugFromR2(slug: string): Promise<Article | null> {
  const snapshot = await loadSnapshot();
  const row = snapshot.articles.find(
    (a) => a.slug === slug && a.published === true,
  );
  return row ? toArticle(row) : null;
}

export async function readLatestArticlesFromR2(
  limit = 10,
  offset = 0,
): Promise<Article[]> {
  const snapshot = await loadSnapshot();
  const published = snapshot.articles
    .filter((a) => a.published === true)
    .sort(compareByPublishedAtDesc);
  return published.slice(offset, offset + limit).map(toArticle);
}

export async function readArticlesByTagKeyFromR2(
  tagKey: string,
  limit = 10,
  offset = 0,
): Promise<Article[]> {
  const snapshot = await loadSnapshot();
  const matched = snapshot.articles
    .filter(
      (a) => a.published === true && a.tags.some((t) => t.tagKey === tagKey),
    )
    .sort(compareByPublishedAtDesc);
  return matched.slice(offset, offset + limit).map(toArticle);
}

export async function readArticlesByTagFromR2(
  tagKey: string,
  limit = 10,
  offset = 0,
): Promise<Article[]> {
  return readArticlesByTagKeyFromR2(tagKey, limit, offset);
}

export async function readAllTagsWithCountFromR2(): Promise<
  { tag: string; tagKey: string; count: number }[]
> {
  const snapshot = await loadSnapshot();
  return snapshot.tagMeta
    .map((t) => ({ tag: t.tagKey, tagKey: t.tagKey, count: t.articleCount }))
    .sort((a, b) => b.count - a.count);
}

export async function readAllUniqueTagsFromR2(): Promise<string[]> {
  const tags = await readAllTagsWithCountFromR2();
  return tags.map((t) => t.tagKey);
}

export async function readArticleTitlesBySlugsFromR2(
  slugs: string[],
): Promise<Record<string, string>> {
  if (slugs.length === 0) return {};
  const snapshot = await loadSnapshot();
  const set = new Set(slugs);
  return Object.fromEntries(
    snapshot.articles.filter((a) => set.has(a.slug)).map((a) => [a.slug, a.title]),
  );
}

export async function readTagKeysForArticleFromR2(
  slug: string,
): Promise<Array<{ tagKey: string }>> {
  const snapshot = await loadSnapshot();
  const article = snapshot.articles.find((a) => a.slug === slug);
  return article ? article.tags.map((t) => ({ tagKey: t.tagKey })) : [];
}

export async function readTagsForArticlesFromR2(
  slugs: string[],
): Promise<Map<string, Array<{ tagKey: string }>>> {
  if (slugs.length === 0) return new Map();
  const snapshot = await loadSnapshot();
  const set = new Set(slugs);
  const result = new Map<string, Array<{ tagKey: string }>>();
  for (const a of snapshot.articles) {
    if (!set.has(a.slug)) continue;
    result.set(a.slug, a.tags.map((t) => ({ tagKey: t.tagKey })));
  }
  return result;
}

export async function readArticleSummariesByTagKeyFromR2(
  tagKey: string,
  limit = 10,
): Promise<Array<{ slug: string; title: string; description: string | null }>> {
  const snapshot = await loadSnapshot();
  return snapshot.articles
    .filter(
      (a) => a.published === true && a.tags.some((t) => t.tagKey === tagKey),
    )
    .sort(compareByPublishedAtDesc)
    .slice(0, limit)
    .map((a) => ({ slug: a.slug, title: a.title, description: a.description }));
}

export async function readBlogSnapshotMetaFromR2(): Promise<{
  tagMeta: SnapshotTagMeta[];
  generatedAt: string;
}> {
  const snapshot = await loadSnapshot();
  return { tagMeta: snapshot.tagMeta, generatedAt: snapshot.generatedAt };
}
