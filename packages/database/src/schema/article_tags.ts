import {
    index,
    primaryKey,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { articles } from "./articles";
import { tags } from "./tags";

export const articleTags = sqliteTable(
  "article_tags",
  {
    slug: text("slug")
      .notNull()
      .references(() => articles.slug, { onDelete: "cascade" }),
    tagKey: text("tag_key")
      .notNull()
      .references(() => tags.tagKey),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.slug, table.tagKey] }),
    tagKeyIdx: index("idx_article_tags_tag_key").on(table.tagKey),
  })
);

export type ArticleTag = typeof articleTags.$inferSelect;
export type InsertArticleTag = typeof articleTags.$inferInsert;
