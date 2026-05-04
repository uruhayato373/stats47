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
 * - area_type で 4 種 (prefecture / city / port / fishing_port) 対応
 * - area_name は snapshot export 用 denorm (JOIN より速い)
 * - unit は snapshot export 用 denorm (metrics.unit と同値)
 */
export const areaProfiles = sqliteTable(
  "area_profiles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    areaType: text("area_type", {
      enum: ["prefecture", "city", "port", "fishing_port"],
    }).notNull(),
    areaCode: text("area_code").notNull(),
    areaName: text("area_name").notNull(),
    metricId: integer("metric_id")
      .notNull()
      .references(() => metrics.id),
    yearCode: text("year_code").notNull(),
    type: text("type", { enum: ["strength", "weakness"] }).notNull(),
    rank: integer("rank").notNull(),
    value: real("value").notNull(),
    unit: text("unit").notNull(),
    percentile: real("percentile").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    unq: uniqueIndex("idx_area_profiles_entity_metric_type").on(
      table.areaType,
      table.areaCode,
      table.metricId,
      table.type
    ),
    entityIdx: index("idx_area_profiles_entity").on(
      table.areaType,
      table.areaCode
    ),
    metricIdx: index("idx_area_profiles_metric").on(table.metricId),
    rankIdx: index("idx_area_profiles_rank").on(table.rank),
  })
);

export type AreaProfile = typeof areaProfiles.$inferSelect;
export type InsertAreaProfile = typeof areaProfiles.$inferInsert;

export const insertAreaProfileSchema = createInsertSchema(areaProfiles);
export const selectAreaProfileSchema = createSelectSchema(areaProfiles);
