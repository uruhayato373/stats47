import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { metrics } from "./metrics";

export const statsPort = sqliteTable(
  "stats_port",
  {
    metricKey: text("metric_key").notNull(),
    areaCode: text("area_code").notNull(),
    areaName: text("area_name").notNull().default(""),
    prefectureCode: text("prefecture_code"),
    yearCode: text("year_code").notNull(),
    yearName: text("year_name").notNull().default(""),
    value: real("value"),
    unit: text("unit").notNull().default(""),
    rank: integer("rank"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.metricKey, table.areaCode, table.yearCode] }),
    fk: foreignKey({ columns: [table.metricKey], foreignColumns: [metrics.key] }),
    entityIdx: index("idx_stats_port_entity").on(table.areaCode, table.yearCode),
    metricYearIdx: index("idx_stats_port_metric_year").on(table.metricKey, table.yearCode),
    prefCodeIdx: index("idx_stats_port_pref_code").on(table.prefectureCode, table.metricKey),
  })
);

export type StatsPort = typeof statsPort.$inferSelect;
export type InsertStatsPort = typeof statsPort.$inferInsert;

export const insertStatsPortSchema = createInsertSchema(statsPort);
export const selectStatsPortSchema = createSelectSchema(statsPort);
