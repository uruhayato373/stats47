import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const prefectures = sqliteTable(
  "prefectures",
  {
    code: text("code").primaryKey(),
    name: text("name").notNull(),
    region: text("region"),
    displayOrder: integer("display_order"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    nameIdx: index("idx_prefectures_name").on(table.name),
  })
);

export type Prefecture = typeof prefectures.$inferSelect;
export type InsertPrefecture = typeof prefectures.$inferInsert;

export const insertPrefectureSchema = createInsertSchema(prefectures);
export const selectPrefectureSchema = createSelectSchema(prefectures);
