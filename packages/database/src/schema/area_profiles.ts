import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { indicators } from "./indicators";

/**
 * 地域プロフィールの強み・弱み — 旧 area_profile_rankings の置換 (PR-5)
 *
 * - ranking_key (TEXT) → indicator_id (INTEGER FK) に変更
 * - 旧テーブルは area_type なし (全データ prefecture) → entity_type カラム追加
 * - port / city への将来拡張に備え entity_type は CHECK 制約あり
 */
export const areaProfiles = sqliteTable(
  "area_profiles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entityType: text("entity_type", {
      enum: ["prefecture", "city", "port", "fishing_port"],
    }).notNull(),
    entityCode: text("entity_code").notNull(),
    entityName: text("entity_name").notNull(),
    indicatorId: integer("indicator_id")
      .notNull()
      .references(() => indicators.id),
    yearCode: text("year_code").notNull(),
    type: text("type", { enum: ["strength", "weakness"] }).notNull(),
    rank: integer("rank").notNull(),
    valueNumeric: real("value_numeric").notNull(),
    unit: text("unit").notNull(),
    percentile: real("percentile").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    unq: uniqueIndex("idx_area_profiles_entity_indicator_type").on(
      table.entityType,
      table.entityCode,
      table.indicatorId,
      table.type
    ),
    entityIdx: index("idx_area_profiles_entity").on(
      table.entityType,
      table.entityCode
    ),
    indicatorIdx: index("idx_area_profiles_indicator").on(table.indicatorId),
    rankIdx: index("idx_area_profiles_rank").on(table.rank),
  })
);

export type AreaProfile = typeof areaProfiles.$inferSelect;
export type InsertAreaProfile = typeof areaProfiles.$inferInsert;

export const insertAreaProfileSchema = createInsertSchema(areaProfiles);
export const selectAreaProfileSchema = createSelectSchema(areaProfiles);
