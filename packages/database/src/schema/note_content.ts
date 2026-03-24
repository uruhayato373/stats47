import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const noteArticles = sqliteTable(
  "note_articles",
  {
    id: text("id").primaryKey(),
    rankingKey: text("ranking_key").notNull(),
    relatedRankingKeys: text("related_ranking_keys"),
    title: text("title"),
    summary: text("summary"),
    filePath: text("file_path"),
    coverImagePrompt: text("cover_image_prompt"),
    status: text("status", { enum: ["draft", "ready", "published"] })
      .notNull()
      .default("draft"),
    noteUrl: text("note_url"),
    notePrice: integer("note_price").default(0),
    publishedAt: text("published_at"),
    aiModel: text("ai_model"),
    promptVersion: text("prompt_version"),
    generatedAt: text("generated_at"),
    dataHash: text("data_hash"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    rankingKeyIdx: index("idx_note_articles_ranking_key").on(table.rankingKey),
    statusIdx: index("idx_note_articles_status").on(table.status),
  })
);

export type NoteArticleRow = typeof noteArticles.$inferSelect;
export type InsertNoteArticle = typeof noteArticles.$inferInsert;

export const downloadableAssets = sqliteTable(
  "downloadable_assets",
  {
    id: text("id").primaryKey(),
    noteArticleId: text("note_article_id"),
    rankingKey: text("ranking_key").notNull(),
    assetType: text("asset_type", { enum: ["csv", "svg", "pptx"] }).notNull(),
    label: text("label").notNull(),
    description: text("description"),
    r2Key: text("r2_key"),
    publicUrl: text("public_url"),
    fileSizeBytes: integer("file_size_bytes"),
    rowCount: integer("row_count"),
    columnNames: text("column_names"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    noteArticleIdIdx: index("idx_downloadable_assets_note_article_id").on(
      table.noteArticleId
    ),
    rankingKeyIdx: index("idx_downloadable_assets_ranking_key").on(
      table.rankingKey
    ),
  })
);

export type DownloadableAssetRow = typeof downloadableAssets.$inferSelect;
export type InsertDownloadableAsset = typeof downloadableAssets.$inferInsert;
