import { type ArticleRow } from './article.types';

export const BLOG_SNAPSHOT_KEY = 'app/blog/all.json';

export interface SnapshotArticleTag {
  tagKey: string;
}

export interface SnapshotArticle extends Omit<ArticleRow, 'tags'> {
  tags: SnapshotArticleTag[];
  /** article chart source.json → survey taxonomy core の派生結果。 */
  surveyIds?: string[];
}

export interface SnapshotTagMeta {
  tagKey: string;
  articleCount: number;
}

export interface BlogSnapshot {
  /** v2: surveyIds と surveyArticleIndex を同時に焼き込む。未指定は旧 snapshot。 */
  schemaVersion?: 2;
  generatedAt: string;
  articles: SnapshotArticle[];
  tagMeta: SnapshotTagMeta[];
  /** surveyId → 公開記事 slug。article.surveyIds から決定的に派生する逆引き索引。 */
  surveyArticleIndex?: Record<string, string[]>;
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
