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
 * 観測値 — metric × area × year の値
 *
 * PK: (metric_key, area_type, area_code, year_code)
 * FK: (metric_key, area_type) → metrics(key, area_type)
 *
 * area_name / year_name / unit は書き込み時に一回計算して denorm 保存。
 * 変更が稀なため JOIN コストを排除する設計。
 */
export const observations = sqliteTable(
  "observations",
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
      columns: [table.metricKey, table.areaType],
      foreignColumns: [metrics.key, metrics.areaType],
    }),
    entityIdx: index("idx_observations_entity").on(
      table.areaType,
      table.areaCode,
      table.yearCode
    ),
    metricYearIdx: index("idx_observations_metric_year").on(
      table.metricKey,
      table.yearCode
    ),
  })
);

export type Observation = typeof observations.$inferSelect;
export type InsertObservation = typeof observations.$inferInsert;

export const insertObservationSchema = createInsertSchema(observations);
export const selectObservationSchema = createSelectSchema(observations);
