import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { prefectures } from "./prefectures";

export const cities = sqliteTable(
  "cities",
  {
    code: text("code").primaryKey(),
    name: text("name").notNull(),
    prefectureCode: text("prefecture_code").references(() => prefectures.code),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    prefectureIdx: index("idx_cities_prefecture").on(table.prefectureCode),
    nameIdx: index("idx_cities_name").on(table.name),
  })
);

export type City = typeof cities.$inferSelect;
export type InsertCity = typeof cities.$inferInsert;

export const insertCitySchema = createInsertSchema(cities);
export const selectCitySchema = createSelectSchema(cities);
