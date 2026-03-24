import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const estatStatsTables = sqliteTable(
  "estat_stats_tables",
  {
    statsDataId: text("stats_data_id").primaryKey(),
    title: text("title").notNull(),
    statName: text("stat_name"),
    govOrg: text("gov_org"),
    categoryKey: text("category_key"),
    statsField: text("stats_field"),
    areaType: text("area_type"),
    cycle: text("cycle"),
    surveyDate: text("survey_date"),
    updatedDate: text("updated_date"),
    classInf: text("class_inf"),
    status: text("status").notNull().default("candidate"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    categoryKeyIdx: index("idx_est_category_key").on(table.categoryKey),
    statsFieldIdx: index("idx_est_stats_field").on(table.statsField),
    statusIdx: index("idx_est_status").on(table.status),
  })
);

export type EstatStatsTable = typeof estatStatsTables.$inferSelect;
export type InsertEstatStatsTable = typeof estatStatsTables.$inferInsert;
