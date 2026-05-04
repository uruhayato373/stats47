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

import { metrics } from "./metrics";

/**
 * 地域プロフィールの強み・弱み
 *
 * - metric_id (INTEGER FK → metrics.id)
 * - entity_type で 4 種 (prefecture / city / port / fishing_port) 対応
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
    metricId: integer("metric_id")
      .notNull()
      .references(() => metrics.id),
    yearCode: text("year_code").notNull(),
    type: text("type", { enum: ["strength", "weakness"] }).notNull(),
    rank: integer("rank").notNull(),
    valueNumeric: real("value_numeric").notNull(),
    unit: text("unit").notNull(),
    percentile: real("percentile").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    unq: uniqueIndex("idx_area_profiles_entity_metric_type").on(
      table.entityType,
      table.entityCode,
      table.metricId,
      table.type
    ),
    entityIdx: index("idx_area_profiles_entity").on(
      table.entityType,
      table.entityCode
    ),
    metricIdx: index("idx_area_profiles_metric").on(table.metricId),
    rankIdx: index("idx_area_profiles_rank").on(table.rank),
  })
);

export type AreaProfile = typeof areaProfiles.$inferSelect;
export type InsertAreaProfile = typeof areaProfiles.$inferInsert;

export const insertAreaProfileSchema = createInsertSchema(areaProfiles);
export const selectAreaProfileSchema = createSelectSchema(areaProfiles);
