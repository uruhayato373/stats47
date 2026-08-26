import 'server-only';

import { createSnapshotReader } from '@stats47/r2-storage/server';

import {
  BLOG_SNAPSHOT_KEY,
  parseBlogSnapshot,
  type BlogSnapshot,
  type SnapshotArticle,
  type SnapshotTagMeta,
} from '../types/snapshot';

import type { Article, ArticleFrontmatter } from '../types/article.types';

// module-level キャッシュは持たない (r2-storage-design.md)。
// re-push 直後の取りこぼしや warm isolate の stale 保持を防ぐため毎回 R2 を直接 fetch する。
const loadSnapshot = createSnapshotReader<BlogSnapshot, BlogSnapshot>({
  key: BLOG_SNAPSHOT_KEY,
  label: 'blog',
  parse: parseBlogSnapshot,
  select: (snapshot) => snapshot,
  fallback: {
    generatedAt: new Date(0).toISOString(),
    articles: [],
    tagMeta: [],
  },
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
    surveyIds: row.surveyIds ?? [],
    tags: JSON.stringify(row.tags ?? []),
    content: '',
    frontmatter,
  };
}

function compareByPublishedAtDesc(
  a: SnapshotArticle,
  b: SnapshotArticle
): number {
  const ap = a.publishedAt ?? '';
  const bp = b.publishedAt ?? '';
  if (ap !== bp) return ap < bp ? 1 : -1;
  const ac = a.createdAt ?? '';
  const bc = b.createdAt ?? '';
  if (ac !== bc) return ac < bc ? 1 : -1;
  return 0;
}

export async function readArticleBySlugFromR2(
  slug: string
): Promise<Article | null> {
  const snapshot = await loadSnapshot();
  const row = snapshot.articles.find(
    (a) => a.slug === slug && a.published === true
  );
  return row ? toArticle(row) : null;
}

export async function readLatestArticlesFromR2(
  limit = 10,
  offset = 0
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
  offset = 0
): Promise<Article[]> {
  const snapshot = await loadSnapshot();
  const matched = snapshot.articles
    .filter(
      (a) => a.published === true && a.tags.some((t) => t.tagKey === tagKey)
    )
    .sort(compareByPublishedAtDesc);
  return matched.slice(offset, offset + limit).map(toArticle);
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
  slugs: string[]
): Promise<Record<string, string>> {
  if (slugs.length === 0) return {};
  const snapshot = await loadSnapshot();
  const set = new Set(slugs);
  return Object.fromEntries(
    snapshot.articles
      .filter((a) => set.has(a.slug))
      .map((a) => [a.slug, a.title])
  );
}

export async function readTagKeysForArticleFromR2(
  slug: string
): Promise<Array<{ tagKey: string }>> {
  const snapshot = await loadSnapshot();
  const article = snapshot.articles.find((a) => a.slug === slug);
  return article ? article.tags.map((t) => ({ tagKey: t.tagKey })) : [];
}

export async function readTagsForArticlesFromR2(
  slugs: string[]
): Promise<Map<string, Array<{ tagKey: string }>>> {
  if (slugs.length === 0) return new Map();
  const snapshot = await loadSnapshot();
  const set = new Set(slugs);
  const result = new Map<string, Array<{ tagKey: string }>>();
  for (const a of snapshot.articles) {
    if (!set.has(a.slug)) continue;
    result.set(
      a.slug,
      a.tags.map((t) => ({ tagKey: t.tagKey }))
    );
  }
  return result;
}

export async function readArticleSummariesByTagKeyFromR2(
  tagKey: string,
  limit = 10
): Promise<Array<{ slug: string; title: string; description: string | null }>> {
  const snapshot = await loadSnapshot();
  return snapshot.articles
    .filter(
      (a) => a.published === true && a.tags.some((t) => t.tagKey === tagKey)
    )
    .sort(compareByPublishedAtDesc)
    .slice(0, limit)
    .map((a) => ({ slug: a.slug, title: a.title, description: a.description }));
}

export async function readArticleSummariesBySurveyIdFromR2(
  surveyId: string,
  limit = 6
): Promise<Array<{ slug: string; title: string; description: string | null }>> {
  const snapshot = await loadSnapshot();
  const indexedSlugs = snapshot.surveyArticleIndex?.[surveyId];
  const indexedSlugSet = indexedSlugs ? new Set(indexedSlugs) : null;
  return snapshot.articles
    .filter(
      (article) =>
        article.published === true &&
        (indexedSlugSet
          ? indexedSlugSet.has(article.slug)
          : Array.isArray(article.surveyIds) &&
            article.surveyIds.includes(surveyId))
    )
    .sort(compareByPublishedAtDesc)
    .slice(0, limit)
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      description: article.description,
    }));
}

export async function readBlogSnapshotMetaFromR2(): Promise<{
  tagMeta: SnapshotTagMeta[];
  generatedAt: string;
}> {
  const snapshot = await loadSnapshot();
  return { tagMeta: snapshot.tagMeta, generatedAt: snapshot.generatedAt };
}

export interface BlogIndexPageResult {
  articles: Article[];
  meta: { tagMeta: SnapshotTagMeta[]; generatedAt: string };
  /** 次ページが存在するか (総件数は数えない) */
  hasNextPage: boolean;
}

/**
 * `/blog` 一覧が 1 リクエストで必要とするものを snapshot 1 回読みで返す。
 *
 * 個別 reader (`readLatestArticlesFromR2` / `readBlogSnapshotMetaFromR2`) を並べると、
 * module cache を持たない設計上、同一リクエスト内で full snapshot を 3 回取得していた
 * (記事 + meta + 次ページ判定)。module cache を足すと re-push 直後の stale を招くため、
 * 「1 回 load して必要なものを全部返す」形にする。
 *
 * 次ページ判定は `pageSize + 1` 件を切り出して余りの有無で見る (総件数を数えない)。
 */
export async function readBlogIndexPageFromR2(
  pageSize: number,
  offset: number
): Promise<BlogIndexPageResult> {
  const snapshot = await loadSnapshot();
  const published = snapshot.articles
    .filter((a) => a.published === true)
    .sort(compareByPublishedAtDesc);
  const window = published.slice(offset, offset + pageSize + 1);

  return {
    articles: window.slice(0, pageSize).map(toArticle),
    meta: { tagMeta: snapshot.tagMeta, generatedAt: snapshot.generatedAt },
    hasNextPage: window.length > pageSize,
  };
}
