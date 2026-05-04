import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * surveys テーブル — 旧 ranking_items.ts に同居していた survey マスタ。
 *
 * indicators.surveyId が参照するため本ファイルに残す。
 * (旧 ranking_items / ranking_data / ranking_tags は PR-5 で DROP した)
 */
export const surveys = sqliteTable("surveys", {
  id: text("id").primaryKey(),
  organization: text("organization").notNull(),
  name: text("name").notNull(),
  url: text("url"),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;
