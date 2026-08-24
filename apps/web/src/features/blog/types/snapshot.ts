import { type ArticleRow } from "./article.types";

export const BLOG_SNAPSHOT_KEY = "app/blog/all.json";

export interface SnapshotArticleTag {
  tagKey: string;
}

export interface SnapshotArticle extends Omit<ArticleRow, "tags"> {
  tags: SnapshotArticleTag[];
  /** article chart source.json → survey taxonomy core の派生結果。 */
  surveyIds?: string[];
}

export interface SnapshotTagMeta {
  tagKey: string;
  articleCount: number;
}

export interface BlogSnapshot {
  generatedAt: string;
  articles: SnapshotArticle[];
  tagMeta: SnapshotTagMeta[];
}
