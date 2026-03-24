import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const estatMetainfo = sqliteTable(
  "estat_metainfo",
  {
    statsDataId: text("stats_data_id").primaryKey(),
    statName: text("stat_name").notNull(),
    title: text("title").notNull(),
    areaType: text("area_type", {
      enum: ["national", "prefecture", "city"],
    })
      .notNull()
      .default("national"),
    description: text("description"),
    cycle: text("cycle"),
    surveyDate: text("survey_date"),
    lastFetchedAt: integer("last_fetched_at", { mode: "timestamp" }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    itemNamePrefix: text("item_name_prefix"),
    memo: text("memo"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    categoryFilters: text("category_filters"), // JSON
  },
  (table) => ({
    areaTypeCheck: check(
      "estat_metainfo_area_type_check",
      sql`${table.areaType} IN ('national', 'prefecture', 'city')`
    ),
    statNameIdx: index("idx_estat_metainfo_stat_name").on(table.statName),
    titleIdx: index("idx_estat_metainfo_title").on(table.title),
    areaTypeIdx: index("idx_estat_metainfo_area_type").on(table.areaType),
    updatedAtIdx: index("idx_estat_metainfo_updated_at").on(table.updatedAt),
  })
);

export type EstatMetainfo = typeof estatMetainfo.$inferSelect;
export type InsertEstatMetainfo = typeof estatMetainfo.$inferInsert;

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertEstatMetainfoSchema = createInsertSchema(estatMetainfo);
export const selectEstatMetainfoSchema = createSelectSchema(estatMetainfo);

