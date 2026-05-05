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

/**
 * 統計値 — metric × area × year の値
 *
 * PK: (metric_key, area_type, area_code, year_code)
 * FK: metric_key → metrics(key)  ← 単独キー（area_type は stats が保持）
 *
 * area_name / year_name / unit は書き込み時に一回計算して denorm 保存。
 * 変更が稀なため JOIN コストを排除する設計。
 */
export const stats = sqliteTable(
  "stats",
  {
    metricKey: text("metric_key").notNull(),
    areaType: text("area_type", {
      enum: ["prefecture", "city", "port", "fishing_port"],
    }).notNull(),
    areaCode: text("area_code").notNull(),
    areaName: text("area_name").notNull().default(""),
    yearCode: text("year_code").notNull(),
    yearName: text("year_name").notNull().default(""),
    value: real("value"),
    unit: text("unit").notNull().default(""),
    rank: integer("rank"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.metricKey,
        table.areaType,
        table.areaCode,
        table.yearCode,
      ],
    }),
    fk: foreignKey({
      columns: [table.metricKey],
      foreignColumns: [metrics.key],
    }),
    entityIdx: index("idx_stats_entity").on(
      table.areaType,
      table.areaCode,
      table.yearCode
    ),
    metricYearIdx: index("idx_stats_metric_year").on(
      table.metricKey,
      table.yearCode
    ),
    metricAreaTypeIdx: index("idx_stats_metric_atype").on(
      table.metricKey,
      table.areaType
    ),
  })
);

export type Observation = typeof stats.$inferSelect;
export type InsertObservation = typeof stats.$inferInsert;

export const insertObservationSchema = createInsertSchema(stats);
export const selectObservationSchema = createSelectSchema(stats);
