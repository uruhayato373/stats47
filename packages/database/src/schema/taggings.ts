import { sql } from "drizzle-orm";
import {
  check,
  index,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { tags } from "./tags";

/**
 * Polymorphic タグ M:N — 旧 article_tags + indicator_tags の統合 (2026-05-04)
 *
 * taggable_type で entity 種別を区別、taggable_id で対象 ID (TEXT で article slug /
 * metric id 両対応) を保持。
 *
 * - article: taggable_id = articles.slug
 * - metric:  taggable_id = metrics.key (PR #211: 旧 CAST(metrics.id AS TEXT) から変更)
 *
 * FK CASCADE は polymorphic のため articles(slug) / metrics(key) には張れない。
 * tag_key への FK のみ維持。entity 削除時はアプリ側で明示的に taggings から DELETE する。
 */
export const taggings = sqliteTable(
  "taggings",
  {
    taggableType: text("taggable_type", {
      enum: ["article", "metric"],
    }).notNull(),
    taggableId: text("taggable_id").notNull(),
    tagKey: text("tag_key")
      .notNull()
      .references(() => tags.tagKey),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.taggableType, table.taggableId, table.tagKey],
    }),
    typeCheck: check(
      "taggings_type_check",
      sql`${table.taggableType} IN ('article', 'metric')`
    ),
    tagKeyIdx: index("idx_taggings_tag_key").on(table.tagKey),
    entityIdx: index("idx_taggings_entity").on(
      table.taggableType,
      table.taggableId
    ),
  })
);

export type Tagging = typeof taggings.$inferSelect;
export type InsertTagging = typeof taggings.$inferInsert;

export const insertTaggingSchema = createInsertSchema(taggings);
export const selectTaggingSchema = createSelectSchema(taggings);
