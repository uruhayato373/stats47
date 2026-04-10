import { sql } from "drizzle-orm";
import {
    index,
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const articles = sqliteTable(
  "articles",
  {
    slug:        text("slug").primaryKey(),
    title:       text("title").notNull(),
    seoTitle:    text("seo_title"),
    description: text("description"),
    filePath:    text("file_path").notNull(),
    format:      text("format").default("mdx"),
    hasCharts:   integer("has_charts", { mode: "boolean" }).default(false),
    published:   integer("published", { mode: "boolean" }).default(false),
    publishedAt: text("published_at"),
    ogImageType: text("og_image_type"),
    ogpTitle:    text("ogp_title"),
    ogpSubtitle: text("ogp_subtitle"),
    proofreadAt: text("proofread_at"),
    createdAt:   text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt:   text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    publishedAtIdx: index("idx_articles_published_at").on(table.publishedAt),
    filePathIdx:    index("idx_articles_file_path").on(table.filePath),
  })
);

export type ArticleRow = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

export const insertArticleSchema = createInsertSchema(articles);
export const selectArticleSchema = createSelectSchema(articles);
