import { type ArticleRow } from "@stats47/database/schema";

export const BLOG_SNAPSHOT_KEY = "snapshots/blog/all.json";

export interface SnapshotArticleTag {
  tagKey: string;
  tagName: string;
}

export interface SnapshotArticle extends ArticleRow {
  tags: SnapshotArticleTag[];
}

export interface SnapshotTagMeta {
  tagKey: string;
  tagName: string;
  articleCount: number;
}

export interface BlogSnapshot {
  generatedAt: string;
  articles: SnapshotArticle[];
  tagMeta: SnapshotTagMeta[];
}
