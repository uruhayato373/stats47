import { sql } from "drizzle-orm";
import {
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
 * 観測値 — metric × entity × year の値
 *
 * (metric_id, entity_type, entity_code, year_code) の複合 PK で一意。
 * entity_type は 4 種: prefecture / city / port / fishing_port
 *
 * 値カラム:
 * - value_numeric: 数値の本体
 * - value_text: 「未公表」等の non-numeric ラベル
 *
 * 非正規化列 (entity_name / year_name / unit / category_name):
 * R2 export 時に使用。マスタ (prefectures.name 等) を書き換えた場合は
 * scripts/sync-observations-denormalized.ts で再同期する。
 */
export const observations = sqliteTable(
  "observations",
  {
    metricId: integer("metric_id")
      .notNull()
      .references(() => metrics.id),
    entityType: text("entity_type", {
      enum: ["prefecture", "city", "port", "fishing_port"],
    }).notNull(),
    entityCode: text("entity_code").notNull(),
    yearCode: text("year_code").notNull(),
    valueNumeric: real("value_numeric"),
    valueText: text("value_text"),
    rank: integer("rank"),
    percentile: real("percentile"),
    entityName: text("entity_name"),
    yearName: text("year_name"),
    unit: text("unit"),
    categoryName: text("category_name"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.metricId,
        table.entityType,
        table.entityCode,
        table.yearCode,
      ],
    }),
    entityIdx: index("idx_observations_entity").on(
      table.entityType,
      table.entityCode,
      table.yearCode
    ),
    metricYearIdx: index("idx_observations_metric_year").on(
      table.metricId,
      table.yearCode
    ),
  })
);

export type Observation = typeof observations.$inferSelect;
export type InsertObservation = typeof observations.$inferInsert;

export const insertObservationSchema = createInsertSchema(observations);
export const selectObservationSchema = createSelectSchema(observations);
