import { type DataSourceEntry } from '@stats47/data-configs';

import { type ArticleRow } from './article.types';

export const BLOG_SNAPSHOT_KEY = 'app/blog/all.json';

export interface SnapshotArticleTag {
  tagKey: string;
}

/** 記事が使う指標 1 件。year は図に描いた年 (図の source.json の `year`)。本文のリンクだけの指標は年を持たない。 */
export interface SnapshotRankingRef {
  rankingKey: string;
  year?: string;
}

export interface SnapshotArticle extends Omit<ArticleRow, 'tags'> {
  tags: SnapshotArticleTag[];
  /** article chart source.json → survey taxonomy core の派生結果。 */
  surveyIds?: string[];
  /** 記事末尾「データ出典」の行 (chart source.json / geo item から派生)。 */
  sources?: DataSourceEntry[];
  /** 散布図 source.json が示す 2 指標ペア (各ペア昇順・重複なし)。ペアの無い記事は省略。 */
  metricPairs?: Array<[string, string]>;
  /** 記事が使う指標 (図の source.json と本文の /ranking/ リンク)。指標 → 記事の回遊と、図の年の鮮度判定に使う。 */
  rankingRefs?: SnapshotRankingRef[];
}

export interface SnapshotTagMeta {
  tagKey: string;
  articleCount: number;
}

export interface BlogSnapshot {
  /** Publisher-only generation/base guard; legacy readers remain compatible. */
  publication?: { contractSha256: string; baseSnapshotSha256: string };
  /** v2: surveyIds と surveyArticleIndex を同時に焼き込む。未指定は旧 snapshot。 */
  schemaVersion?: 2;
  generatedAt: string;
  articles: SnapshotArticle[];
  tagMeta: SnapshotTagMeta[];
  /** surveyId → 公開記事 slug。article.surveyIds から決定的に派生する逆引き索引。 */
  surveyArticleIndex?: Record<string, string[]>;
  /** rankingKey → 相手 rankingKey → 公開記事 slug。article.metricPairs から決定的に派生 (両方向)。 */
  metricPairArticleIndex?: Record<string, Record<string, string[]>>;
  /** rankingKey → その指標を使う公開記事 slug。article.rankingRefs から決定的に派生する逆引き索引。 */
  rankingArticleIndex?: Record<string, string[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertNullableString(value: unknown, path: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') throw new Error(`${path} must be string or null`);
  return value;
}

function assertNullableBoolean(value: unknown, path: string): boolean | null {
  if (value === null) return null;
  if (typeof value !== 'boolean') throw new Error(`${path} must be boolean or null`);
  return value;
}

function isDataSourceEntry(value: unknown): value is DataSourceEntry {
  return isRecord(value) && typeof value.label === 'string' && value.label.length > 0 &&
    Array.isArray(value.tables) && value.tables.every(
      (table) => isRecord(table) && typeof table.label === 'string' && typeof table.url === 'string'
    ) &&
    (['organization', 'surveyId', 'url', 'license', 'note'] as const).every(
      (field) => value[field] === undefined || typeof value[field] === 'string'
    );
}

function parseSnapshotArticle(value: unknown, index: number): SnapshotArticle {
  if (!isRecord(value)) throw new Error(`articles[${index}] must be an object`);
  const path = (field: string) => `articles[${index}].${field}`;
  for (const field of ['slug', 'title', 'filePath'] as const) {
    if (typeof value[field] !== 'string' || value[field].length === 0) {
      throw new Error(`${path(field)} must be a non-empty string`);
    }
  }
  if (!Array.isArray(value.tags) || !value.tags.every(
    (tag) => isRecord(tag) && typeof tag.tagKey === 'string'
  )) {
    throw new Error(`${path('tags')} must contain tagKey objects`);
  }
  if (value.surveyIds !== undefined && (!Array.isArray(value.surveyIds) ||
    !value.surveyIds.every((surveyId) => typeof surveyId === 'string'))) {
    throw new Error(`${path('surveyIds')} must contain strings`);
  }
  if (value.sources !== undefined && (!Array.isArray(value.sources) ||
    !value.sources.every(isDataSourceEntry))) {
    throw new Error(`${path('sources')} must contain data source entries`);
  }
  if (value.metricPairs !== undefined && (!Array.isArray(value.metricPairs) ||
    !value.metricPairs.every((pair) => Array.isArray(pair) && pair.length === 2 &&
      pair.every((key) => typeof key === 'string')))) {
    throw new Error(`${path('metricPairs')} must contain [string, string] pairs`);
  }
  if (value.rankingRefs !== undefined && (!Array.isArray(value.rankingRefs) ||
    !value.rankingRefs.every((ref) => isRecord(ref) && typeof ref.rankingKey === 'string' &&
      (ref.year === undefined || typeof ref.year === 'string')))) {
    throw new Error(`${path('rankingRefs')} must contain { rankingKey, year? } objects`);
  }
  return {
    slug: value.slug as string,
    title: value.title as string,
    seoTitle: assertNullableString(value.seoTitle, path('seoTitle')),
    description: assertNullableString(value.description, path('description')),
    filePath: value.filePath as string,
    format: assertNullableString(value.format, path('format')),
    hasCharts: assertNullableBoolean(value.hasCharts, path('hasCharts')),
    published: assertNullableBoolean(value.published, path('published')),
    publishedAt: assertNullableString(value.publishedAt, path('publishedAt')),
    ogImageType: assertNullableString(value.ogImageType, path('ogImageType')),
    proofreadAt: assertNullableString(value.proofreadAt, path('proofreadAt')),
    createdAt: assertNullableString(value.createdAt, path('createdAt')),
    updatedAt: assertNullableString(value.updatedAt, path('updatedAt')),
    tags: value.tags as SnapshotArticleTag[],
    ...(value.surveyIds === undefined ? {} : { surveyIds: value.surveyIds as string[] }),
    ...(value.sources === undefined ? {} : { sources: value.sources as DataSourceEntry[] }),
    ...(value.metricPairs === undefined
      ? {}
      : { metricPairs: value.metricPairs as Array<[string, string]> }),
    ...(value.rankingRefs === undefined
      ? {}
      : { rankingRefs: value.rankingRefs as SnapshotRankingRef[] }),
  };
}

/** v1(無印)を読みつつ、未知versionと壊れた記事を配信境界で拒否する。 */
export function parseBlogSnapshot(value: unknown): BlogSnapshot {
  if (!isRecord(value)) throw new Error('blog snapshot must be an object');
  if (value.schemaVersion !== undefined && value.schemaVersion !== 2) {
    throw new Error('blog snapshot schemaVersion must be 2 or omitted legacy');
  }
  if (typeof value.generatedAt !== 'string' || !Number.isFinite(Date.parse(value.generatedAt))) {
    throw new Error('blog snapshot generatedAt must be a valid date string');
  }
  if (!Array.isArray(value.articles)) throw new Error('articles must be an array');
  if (!Array.isArray(value.tagMeta) || !value.tagMeta.every(
    (tag) => isRecord(tag) && typeof tag.tagKey === 'string' && Number.isInteger(tag.articleCount)
  )) {
    throw new Error('tagMeta must contain valid tag metadata');
  }
  if (value.surveyArticleIndex !== undefined && (!isRecord(value.surveyArticleIndex) ||
    !Object.values(value.surveyArticleIndex).every(
      (slugs) => Array.isArray(slugs) && slugs.every((slug) => typeof slug === 'string')
    ))) {
    throw new Error('surveyArticleIndex must map survey IDs to string arrays');
  }
  if (value.metricPairArticleIndex !== undefined && (!isRecord(value.metricPairArticleIndex) ||
    !Object.values(value.metricPairArticleIndex).every((byPair) => isRecord(byPair) &&
      Object.values(byPair).every(
        (slugs) => Array.isArray(slugs) && slugs.every((slug) => typeof slug === 'string')
      )))) {
    throw new Error('metricPairArticleIndex must map ranking keys to pair keys to slug arrays');
  }
  if (value.rankingArticleIndex !== undefined && (!isRecord(value.rankingArticleIndex) ||
    !Object.values(value.rankingArticleIndex).every(
      (slugs) => Array.isArray(slugs) && slugs.every((slug) => typeof slug === 'string')
    ))) {
    throw new Error('rankingArticleIndex must map ranking keys to string arrays');
  }
  return {
    ...(value.schemaVersion === 2 ? { schemaVersion: 2 as const } : {}),
    generatedAt: value.generatedAt,
    articles: value.articles.map(parseSnapshotArticle),
    tagMeta: value.tagMeta as SnapshotTagMeta[],
    ...(value.surveyArticleIndex === undefined
      ? {}
      : { surveyArticleIndex: value.surveyArticleIndex as Record<string, string[]> }),
    ...(value.metricPairArticleIndex === undefined
      ? {}
      : {
          metricPairArticleIndex:
            value.metricPairArticleIndex as Record<string, Record<string, string[]>>,
        }),
    ...(value.rankingArticleIndex === undefined
      ? {}
      : { rankingArticleIndex: value.rankingArticleIndex as Record<string, string[]> }),
  };
}

/** rankingKey → その指標を使う公開記事 slug (昇順)。article.rankingRefs から決定的に派生する。 */
export function buildRankingArticleIndex(
  articles: readonly SnapshotArticle[]
): Record<string, string[]> {
  const index = new Map<string, Set<string>>();
  for (const article of articles) {
    if (article.published !== true) continue;
    for (const { rankingKey } of article.rankingRefs ?? []) {
      const slugs = index.get(rankingKey) ?? new Set<string>();
      slugs.add(article.slug);
      index.set(rankingKey, slugs);
    }
  }
  return Object.fromEntries(
    [...index.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([rankingKey, slugs]) => [rankingKey, [...slugs].sort()])
  );
}

export function buildSurveyArticleIndex(
  articles: readonly SnapshotArticle[]
): Record<string, string[]> {
  const index = new Map<string, Set<string>>();
  for (const article of articles) {
    if (article.published !== true) continue;
    for (const surveyId of article.surveyIds ?? []) {
      const slugs = index.get(surveyId) ?? new Set<string>();
      slugs.add(article.slug);
      index.set(surveyId, slugs);
    }
  }
  return Object.fromEntries(
    [...index.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([surveyId, slugs]) => [surveyId, [...slugs].sort()])
  );
}

export function buildMetricPairArticleIndex(
  articles: readonly SnapshotArticle[]
): Record<string, Record<string, string[]>> {
  const index = new Map<string, Map<string, Set<string>>>();
  const add = (key: string, pairKey: string, slug: string) => {
    const byPair = index.get(key) ?? new Map<string, Set<string>>();
    const slugs = byPair.get(pairKey) ?? new Set<string>();
    slugs.add(slug);
    byPair.set(pairKey, slugs);
    index.set(key, byPair);
  };
  for (const article of articles) {
    if (article.published !== true) continue;
    for (const [a, b] of article.metricPairs ?? []) {
      add(a, b, article.slug);
      add(b, a, article.slug);
    }
  }
  return Object.fromEntries(
    [...index.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, byPair]) => [
        key,
        Object.fromEntries(
          [...byPair.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([pairKey, slugs]) => [pairKey, [...slugs].sort()])
        ),
      ])
  );
}

export interface ArticleUsingMetrics {
  slug: string;
  title: string;
  description: string | null;
  /** 渡した指標のうち、その記事が使うもの */
  rankingKeys: string[];
}

/**
 * 渡した指標を使う公開記事。ランキング (1 指標)・エリア (県の特徴指標)・テーマ (テーマの指標)・
 * ブログ (記事自身が使う指標) から、同じ指標を扱う記事へ回遊するための共通の選び方。
 * 一致した指標の多い順、同数なら新しい順。索引が無い旧 snapshot は記事の rankingRefs から作る。
 */
export function selectArticlesUsingRankingKeys(
  snapshot: Pick<BlogSnapshot, 'articles' | 'rankingArticleIndex'>,
  rankingKeys: readonly string[],
  options: { excludeSlug?: string; limit?: number } = {}
): ArticleUsingMetrics[] {
  const index = snapshot.rankingArticleIndex ?? buildRankingArticleIndex(snapshot.articles);
  const matched = new Map<string, Set<string>>();
  for (const key of new Set(rankingKeys)) {
    for (const slug of index[key] ?? []) {
      if (slug === options.excludeSlug) continue;
      const keys = matched.get(slug) ?? new Set<string>();
      keys.add(key);
      matched.set(slug, keys);
    }
  }
  const bySlug = new Map(
    snapshot.articles.filter((a) => a.published === true).map((a) => [a.slug, a])
  );
  return [...matched.entries()]
    .flatMap(([slug, keys]) => {
      const article = bySlug.get(slug);
      return article ? [{ article, keys: [...keys].sort() }] : [];
    })
    .sort(
      (a, b) =>
        b.keys.length - a.keys.length ||
        (b.article.publishedAt ?? '').localeCompare(a.article.publishedAt ?? '') ||
        a.article.slug.localeCompare(b.article.slug)
    )
    .slice(0, options.limit ?? Number.POSITIVE_INFINITY)
    .map(({ article, keys }) => ({
      slug: article.slug,
      title: article.title,
      description: article.description,
      rankingKeys: keys,
    }));
}
