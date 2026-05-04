import { sql } from "drizzle-orm";
import {
  index,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { integer } from "drizzle-orm/sqlite-core";

import { indicators } from "./indicators";
import { tags } from "./tags";

/**
 * 指標 × タグ M:N — 旧 ranking_tags の置換 (PR-5)
 *
 * (ranking_key, area_type, tag_key) PK → (indicator_id, tag_key) PK
 * indicator_id が (key, area_type) を内包するため複合 PK は不要。
 */
export const indicatorTags = sqliteTable(
  "indicator_tags",
  {
    indicatorId: integer("indicator_id")
      .notNull()
      .references(() => indicators.id, { onDelete: "cascade" }),
    tagKey: text("tag_key")
      .notNull()
      .references(() => tags.tagKey),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.indicatorId, table.tagKey] }),
    tagKeyIdx: index("idx_indicator_tags_tag_key").on(table.tagKey),
    indicatorIdx: index("idx_indicator_tags_indicator").on(table.indicatorId),
  })
);

export type IndicatorTag = typeof indicatorTags.$inferSelect;
export type InsertIndicatorTag = typeof indicatorTags.$inferInsert;

export const insertIndicatorTagSchema = createInsertSchema(indicatorTags);
export const selectIndicatorTagSchema = createSelectSchema(indicatorTags);
